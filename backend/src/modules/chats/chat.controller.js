const chatService = require("./chat.service");

const create = async (req, res, next) => {
  try {
    const chat = await chatService.createChat(req.user.id, req.body);
    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { cursor, limit } = req.query;
    const conversation = await chatService.getConversations(
      req.user.id,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );

    const nextCursor =
      conversation.length > 0
        ? conversation[conversation.length - 1].updatedAt
        : null;

    res.status(200).json({
      success: true,
      data: {
        items: conversation,
        nextCursor,
        hasMore: conversation.length === (limit ? parseInt(limit, 10) : 15),
      },
    });
  } catch (err) {
    next(err);
  }
};

const addParticipant = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    const result = await chatService.addParticipant(
      req.user.id,
      conversationId,
      userId,
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const { conversationId, userId } = req.params;

    const result = await chatService.removeUser(
      req.user.id,
      conversationId,
      userId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteGroupChat = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.deleteGroup(req.user.id, conversationId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { conversationId, userId } = req.params;
    const { role } = req.body;
    const result = await chatService.updateUserRole(
      req.user.id,
      conversationId,
      userId,
      role,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  addParticipant,
  removeParticipant,
  deleteGroupChat,
  updateRole,
};
