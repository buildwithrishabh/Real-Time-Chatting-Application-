const File = require("../../model/File");

const create = async (fileData) => {
  return File.create(fileData);
};

const findByPublicId = async (publicId) => {
  return File.findOne({ publicId });
};

const updateVirusStatus = async (publicId, status) => {
  return File.findOneAndUpdate(
    { publicId },
    { virusScanStatus: status },
    { new: true },
  );
};

const findConversationFiles = async (conversationId, limit = 50) => {
  return File.find({ conversationId }).sort({ createdAt: -1 }).limit(limit);
};

const findFileById = async (id) => {
  return File.findById(id);
};

module.exports = {
  create,
  findFileById,
  findByPublicId,
  updateVirusStatus,
  findConversationFiles,
};
