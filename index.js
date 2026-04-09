import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./Config/db.js";
import initSocket from "./Socket/socketHandler.js";
import authRoutes from "./Routes/authRoute.js";
import userRoutes from "./Routes/userRoute.js";
import chatRoutes from "./Routes/chatRoute.js";
import messageRoutes from "./Routes/messageRoute.js";
import notificationRoute from "./Routes/notificationRoute.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

connectDB();

// default route
app.get("/", (rea, res) => {
  res
    .status(200)
    .send("<h1 style='text-align:center;'>Welcome to Backend</h1>");
});
const server = http.createServer(app);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoute);

// Socket.io
//initSocket(server);
const io = initSocket(server);
app.set("io", io); // ✅ store on app

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on the port ${PORT}`));
