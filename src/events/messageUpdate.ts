import { Client, Message, PartialMessage } from "discord.js";
import { logMessageUpdate } from "../utils/logger.js";

export const name = "messageUpdate";
export const once = false;

export async function execute(
  client: Client,
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): Promise<void> {
  if (oldMessage.partial || newMessage.partial) return;
  await logMessageUpdate(client, oldMessage as Message, newMessage as Message);
}
