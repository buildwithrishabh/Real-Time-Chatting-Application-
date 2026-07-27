const Participant = require("../../model/Participant");
const messageService = require("./message.service");

const send = async (req, res, next) => {
  try {
    const message = await messageService.sendMessage(req.user.id, req.body);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit } = req.query;
    const messages = await messageService.getMessages(
      req.user.id,
      conversationId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );

    if (messages.length > 0) {
      const latestMessageId = messages[0]._id;
      await Participant.findOneAndUpdate(
        { conversationId, userId: req.user.id },
        {
          lastReadMessageId: latestMessageId,
        },
      );
    }

    const nextCursor =
      messages.length > 0 ? messages[messages.length - 1].createdAt : null;

    res.status(200).json({
      success: true,
      data: {
        items: messages,
        nextCursor,
        hasMore: messages.length === (limit ? parseInt(limit, 10) : 50),
      },
    });
  } catch (err) {
    next(err);
  }
};

const react = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const updatedMessage = await messageService.addReaction(
      req.user.id,
      id,
      emoji,
    );
    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    next(err);
  }
};

const unreact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const updatedMessage = await messageService.removeReaction(
      req.user.id,
      id,
      emoji,
    );
    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    next(err);
  }
};

const edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const updatedMessage = await messageService.editMessage(
      id,
      req.user.id,
      content,
    );
    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    next(err);
  }
};

const deleteMsg = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const result = await messageService.deleteMessage(req.user.id, id, type);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  send,
  list,
  react,
  unreact,
  edit,
  deleteMsg,
};
