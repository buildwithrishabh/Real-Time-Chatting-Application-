const fileService = require("./file.service");

const getSignUrl = async (req, res, next) => {
  try {
    const { type, mimeType } = req.query;

    const signature = await fileService.getSignature(req.user.id, {
      type,
      mimeType,
    });

    res.status(200).json({ success: true, data: signature });
  } catch (err) {
    next(err);
  }
};

const verifyUploads = async (req, res, next) => {
  try {
    const fileData = await fileService.verifyAndSave(req.user.id, req.body);
    res.status(201).json({ success: true, data: fileData });
  } catch (err) {
    next(err);
  }
};

const handleScanWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-cld-signature"];
    const timestamp = req.headers["x-cld-timestamp"];
    await fileService.handleWebhook({ signature, timestamp, body: req.body });
    res
      .status(200)
      .json({ success: true, message: "Scan processed successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSignUrl,
  verifyUploads,
  handleScanWebhook
}