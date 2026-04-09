import Chat from "../Models/chatSchema.js";

// Get or create 1-on-1 chat
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });

    if (chat) return res.json(chat);

    const newChat = await Chat.create({
      isGroupChat: false,
      participants: [req.user._id, userId],
    });
    chat = await Chat.findById(newChat._id).populate(
      "participants",
      "-password",
    );
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all chats for logged-in user
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "-password")
      .populate("admin", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar email" },
      })
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create group chat
const createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;
    if (!name || !participants || participants.length < 2)
      return res
        .status(400)
        .json({ message: "Group needs a name and at least 2 other members" });

    const allParticipants = [...participants, req.user._id.toString()];
    const chat = await Chat.create({
      name,
      isGroupChat: true,
      participants: allParticipants,
      admin: req.user._id,
    });

    const populated = await Chat.findById(chat._id)
      .populate("participants", "-password")
      .populate("admin", "-password");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Rename group
const renameGroup = async (req, res) => {
  try {
    const { chatId, name } = req.body;
    const chat = await Chat.findByIdAndUpdate(chatId, { name }, { new: true })
      .populate("participants", "-password")
      .populate("admin", "-password");
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add member to group
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: userId } },
      { new: true },
    )
      .populate("participants", "-password")
      .populate("admin", "-password");
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove member from group
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { participants: userId } },
      { new: true },
    )
      .populate("participants", "-password")
      .populate("admin", "-password");
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  accessChat,
  getChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
