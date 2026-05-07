import { Client, ActivityType } from "discord.js";

export const name = "ready";
export const once = true;

export async function execute(client: Client): Promise<void> {
  if (!client.user) return;

  client.user.setPresence({
    activities: [{ name: "your servers", type: ActivityType.Watching }],
    status: "dnd",
  });

  console.log(`[Bot] Logged in as ${client.user.tag}`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);
}
