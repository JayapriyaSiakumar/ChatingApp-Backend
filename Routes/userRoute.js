import express from "express";
import { searchUsers, updateProfile } from "../Controllers/userController.js";
import { protect } from "../Middlewares/authMiddleware.js";
const router = express.Router();
router.get("/", protect, searchUsers);
router.put("/profile", protect, updateProfile);
export default router;
