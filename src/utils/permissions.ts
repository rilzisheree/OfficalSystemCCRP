import { Client, ActivityType } from "discord.js";
import { getOwnerIds } from "../utils/permissions.js";

export const name = "ready";
export const once = true;

export async function execute(client: Client): Promise<void> {
  if (!client.user) return;

  client.user.setPresence({
    activities: [{ name: "Moderating the Shikai World.", type: ActivityType.Watching }],
    status: "dnd",
  });

  const owners = getOwnerIds();
  console.log(`[Bot] Logged in as ${client.user.tag}`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`[Bot] Owner IDs loaded: ${owners.length > 0 ? owners.join(", ") : "NONE — BOT_OWNER_IDS is not set!"}`);
}
