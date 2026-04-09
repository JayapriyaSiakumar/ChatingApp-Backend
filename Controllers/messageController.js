import Message from "../Models/messageSchema.js";
import Chat from "../Models/chatSchema.js";
import Notification from "../Models/notificationSchema.js";

const sendMessage = async (req, res) => {
  try {
    const { chatId, content, type = "text" } = req.body;
    if (!chatId || !content)
      return res
        .status(400)
        .json({ message: "chatId and content are required" });
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content,
      type,
      readBy: [req.user._id],
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    const populated = await Message.findById(message._id)
      .populate("sender", "name avatar email")
      .populate({
        path: "chat",
        populate: { path: "participants", select: "name avatar email" },
      });

    // Create notifications for every other participant
    const chat = populated.chat;
    const otherParticipants = chat.participants.filter(
      (p) => p._id.toString() !== req.user._id.toString(),
    );

    const io = req.app.get("io"); // ✅ always available at request time

    for (const participant of otherParticipants) {
      const notification = await Notification.create({
        recipient: participant._id,
        sender: req.user._id,
        chat: chatId,
        message: message._id,
        type: "message",
        content,
      });

      const populatedNotification = await Notification.findById(
        notification._id,
      )
        .populate("sender", "name avatar")
        .populate("chat", "name isGroupChat")
        .populate("message", "content");

      // Push to recipient's personal socket room
      io.to(participant._id.toString()).emit(
        "notification:new",
        populatedNotification,
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    console.log("MESSAGE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar email")
      .populate("chat")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } },
    );

    // Auto-clear notifications for this chat when user opens it
    await Notification.updateMany(
      { recipient: req.user._id, chat: req.params.chatId, isRead: false },
      { isRead: true },
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { sendMessage, getMessages };
