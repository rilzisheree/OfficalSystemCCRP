import mongoose, { Document, Schema } from "mongoose";

export interface IAllowUser extends Document {
  userId: string;
  guildId: string;
  commands: string[];
}

const AllowUserSchema = new Schema<IAllowUser>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  commands: { type: [String], default: [] },
});

AllowUserSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const AllowUser = mongoose.model<IAllowUser>("AllowUser", AllowUserSchema);
