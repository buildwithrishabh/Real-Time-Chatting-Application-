const fileRepository = require("./file.repository");
const { generateUploadSignature } = require("../../utils/signature");
const { AppError, StatusCodes } = require("../../common/appError");
const cloudinary = require("../../config/cloudinary");
const logger = require("../../config/logger");

// Permitted MIME lists
const ALLOWED_TYPES = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/heic",
    "image/avif",
  ],
  video: [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/mpeg",
    "video/3gpp",
    "video/mkv",
  ],
  raw: [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
  ],
};

// Size thresholds
const LIMITS = {
  image: 15 * 1024 * 1024, // 15MB
  video: 100 * 1024 * 1024, // 100MB
  raw: 100 * 1024 * 1024, // 100MB
};

const getSignature = async (userId, { type, mimeType }) => {
  let category = "raw";
  if (ALLOWED_TYPES.image.includes(mimeType) || mimeType.startsWith("image/")) {
    category = "image";
  } else if (ALLOWED_TYPES.video.includes(mimeType) || mimeType.startsWith("video/")) {
    category = "video";
  }

  const folder = `chat/${category}/${userId}`;
  const maxBytes = LIMITS[category] || 100 * 1024 * 1024;

  const signatureData = generateUploadSignature(folder, category, maxBytes);
  return { ...signatureData, category };
};

const verifyAndSave = async (userId, payload) => {
  const {
    publicId,
    conversationId,
    size,
    mimeType,
    url,
    category,
    width,
    height,
    duration,
  } = payload;

  try {
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: category || "image",
    });

    if (resource.bytes && size && Math.abs(resource.bytes - size) > 500) {
      logger.warn(`File size difference logged: Cloudinary ${resource.bytes} vs payload ${size}`);
    }
  } catch (error) {
    logger.warn(`Cloudinary resource verification note: ${error.message}`);
  }

  const fileMeta = await fileRepository.create({
    url,
    publicId,
    size: size || 0,
    mimeType: mimeType || "application/octet-stream",
    ownerId: userId,
    conversationId,
    width,
    height,
    duration,
    virusScanStatus: "unscanned", // Awaits for cloudinary webhook scan results
  });
  return fileMeta;
};

const handleWebhook = async ({ signature, timestamp, body }) => {
  if (signature && timestamp) {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    const isValid = cloudinary.utils.verifyNotificationSignature(
      bodyStr,
      timestamp,
      signature
    );

    if (!isValid) {
      throw new AppError(
        "Invalid Cloudinary webhook signature",
        StatusCodes.UNAUTHORIZED,
      );
    }
  }

  const publicId = body.public_id || (body.resources && body.resources[0] && body.resources[0].public_id);
  const status = body.status || body.notification_type;

  if (!publicId) {
    throw new AppError(
      "Invalid webhook payload: missing public_id",
      StatusCodes.BAD_REQUEST,
    );
  }

  const scanResult = status === "infected" || status === "rejected" ? "failed" : "passed";

  const updateFile = await fileRepository.updateVirusStatus(
    publicId,
    scanResult,
  );

  if (!updateFile) {
    throw new AppError(
      "File not registered in database",
      StatusCodes.NOT_FOUND,
    );
  }

  // Broadcast real-time scan status update to room participants via Socket.io
  try {
    const { getIO } = require("../../socket");
    const io = getIO();
    if (io && updateFile.conversationId) {
      io.to(`conversation:${updateFile.conversationId}`).emit("file:scan_status", {
        fileId: updateFile._id,
        publicId: updateFile.publicId,
        virusScanStatus: updateFile.virusScanStatus,
      });
    }
  } catch (err) {
    // Socket broadcast fail should not interrupt HTTP 200 webhook response
  }

  return updateFile;
};

module.exports = {
  getSignature,
  verifyAndSave,
  handleWebhook,
};
