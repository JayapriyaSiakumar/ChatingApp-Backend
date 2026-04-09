import express from "express";
import { sendMessage, getMessages } from "../Controllers/messageController.js";
import { protect } from "../Middlewares/authMiddleware.js";
const router = express.Router();
router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
export default router;
