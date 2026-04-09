import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAvatar: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Chat", chatSchema);
