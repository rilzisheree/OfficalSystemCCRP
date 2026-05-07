import mongoose, { Document, Schema } from "mongoose";

export interface ILogChannel extends Document {
  channelId: string;
  guildId: string;
  type: "global";
}

const LogChannelSchema = new Schema<ILogChannel>({
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  type: { type: String, enum: ["global"], default: "global" },
});

export const LogChannel = mongoose.model<ILogChannel>("LogChannel", LogChannelSchema);
