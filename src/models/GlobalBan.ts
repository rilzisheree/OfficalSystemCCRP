import mongoose, { Document, Schema } from "mongoose";

export interface IGlobalBan extends Document {
  userId: string;
  username: string;
  reason: string;
  bannedBy: string;
  bannedByUsername: string;
  bannedAt: Date;
}

const GlobalBanSchema = new Schema<IGlobalBan>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  reason: { type: String, required: true, default: "No reason provided" },
  bannedBy: { type: String, required: true },
  bannedByUsername: { type: String, required: true },
  bannedAt: { type: Date, default: Date.now },
});

export const GlobalBan = mongoose.model<IGlobalBan>("GlobalBan", GlobalBanSchema);
