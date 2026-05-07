import { Client, ActivityType, REST, Routes } from "discord.js";
import { getOwnerIds } from "../utils/permissions.js";

import * as purge from "../commands/moderation/purge.js";
import * as say from "../commands/moderation/say.js";
import * as dm from "../commands/moderation/dm.js";
import * as globalban from "../commands/moderation/globalban.js";
import * as unglobalban from "../commands/moderation/unglobalban.js";
import * as globalbanlist from "../commands/moderation/globalbanlist.js";
import * as allowuser from "../commands/moderation/allowuser.js";
import * as serverlist from "../commands/utility/serverlist.js";
import * as setlogchannel from "../commands/utility/setlogchannel.js";

export const name = "clientReady";
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

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("[Deploy] Skipping command deploy: DISCORD_TOKEN not set.");
    return;
  }

  const commands = [
    purge, say, dm, globalban, unglobalban, globalbanlist,
    allowuser, serverlist, setlogchannel,
  ].map((c) => c.data.toJSON());

  try {
    const rest = new REST({ version: "10" }).setToken(token);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`[Deploy] ${commands.length} slash command(s) registered successfully.`);
  } catch (err) {
    console.error("[Deploy] Failed to register slash commands:", err);
  }
}
