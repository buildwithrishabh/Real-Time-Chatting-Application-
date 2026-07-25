const fileRepository = require("./file.repository");
const { generateUploadSignature } = require("../../utils/signature");
const { AppError, StatusCodes } = require("../../common/appError");
const cloudinary = require("../../config/cloudinary");

// Permitted MIME lists
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  raw: [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// Size thresholds
const LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  raw: 100 * 1024 * 1024, // 100MB
};

const getSignature = async (userId, { type, mimeType }) => {
  let category = "raw";
  if (ALLOWED_TYPES.image.includes(mimeType)) category = "image";
  else if (ALLOWED_TYPES.video.includes(mimeType)) category = "video";
  if (!ALLOWED_TYPES[category].includes(mimeType)) {
    throw new AppError(
      `Unsupported file type: [${mimeType}]`,
      StatusCodes.BAD_REQUEST,
    );
  }

  const folder = `chat/${category}/${userId}`;
  const maxBytes = LIMITS[category];

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
      resource_type: category,
    });

    if (resource.bytes !== size) {
      throw new AppError(
        "File verification failed:  Size mismatch",
        StatusCodes.BAD_REQUEST,
      );
    }
  } catch (error) {
    throw new AppError(
      `Could not verify resource in cloudinary: ${error.message}`,
      StatusCodes.BAD_REQUEST,
    );
  }

  const fileMeta = await fileRepository.create({
    url,
    publicId,
    size,
    mimeType,
    ownerId : userId,
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
