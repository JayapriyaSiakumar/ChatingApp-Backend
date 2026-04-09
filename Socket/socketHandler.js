import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../Models/userSchema.js";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // Mark user online
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    io.emit("user:online", socket.userId);

    // Join personal room
    socket.join(socket.userId);

    // Join a chat room
    socket.on("chat:join", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on("chat:leave", (chatId) => {
      socket.leave(chatId);
    });

    // New message
    socket.on("message:send", (message) => {
      const chat = message.chat;
      if (!chat) return;
      // Broadcast to all in the chat room except sender
      socket.to(chat._id || chat).emit("message:receive", message);
    });

    // Typing indicators
    socket.on("typing:start", ({ chatId, user }) => {
      socket.to(chatId).emit("typing:start", { chatId, user });
    });

    socket.on("typing:stop", ({ chatId, userId }) => {
      socket.to(chatId).emit("typing:stop", { chatId, userId });
    });

    // Notification: client opened a chat, clear those notifications
    socket.on("notification:read-chat", ({ chatId }) => {
      io.to(socket.userId).emit("notification:cleared-chat", { chatId });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("user:offline", { userId: socket.userId, lastSeen: new Date() });
    });
  });

  return io;
};

export default initSocket;
