import { Client, Message, PartialMessage } from "discord.js";
import { logMessageDelete } from "../utils/logger.js";

export const name = "messageDelete";
export const once = false;

export async function execute(client: Client, message: Message | PartialMessage): Promise<void> {
  if (message.partial) {
    try {
      await message.fetch();
    } catch {
      return;
    }
  }
  await logMessageDelete(client, message as Message);
}
