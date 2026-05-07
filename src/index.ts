import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { ExtendedClient, BotCommand } from "./types.js";
import { connectDatabase } from "./database.js";

// ── Commands ──────────────────────────────────────────────────────────────────
import * as purge from "./commands/moderation/purge.js";
import * as say from "./commands/moderation/say.js";
import * as dm from "./commands/moderation/dm.js";
import * as globalban from "./commands/moderation/globalban.js";
import * as unglobalban from "./commands/moderation/unglobalban.js";
import * as globalbanlist from "./commands/moderation/globalbanlist.js";
import * as allowuser from "./commands/moderation/allowuser.js";
import * as serverlist from "./commands/utility/serverlist.js";
import * as setlogchannel from "./commands/utility/setlogchannel.js";

// ── Events ────────────────────────────────────────────────────────────────────
import * as readyEvent from "./events/ready.js";
import * as interactionCreateEvent from "./events/interactionCreate.js";
import * as messageDeleteEvent from "./events/messageDelete.js";
import * as messageUpdateEvent from "./events/messageUpdate.js";
import * as guildMemberAddEvent from "./events/guildMemberAdd.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
}) as ExtendedClient;

client.commands = new Collection<string, BotCommand>();

function loadCommands(): void {
  const commands = [
    purge, say, dm, globalban, unglobalban, globalbanlist, allowuser,
    serverlist, setlogchannel,
  ] as unknown as BotCommand[];

  for (const command of commands) {
    client.commands.set(command.data.name, command);
    console.log(`[Commands] Loaded: /${command.data.name}`);
  }
}

type EventModule = {
  name: string;
  once: boolean;
  execute: (...args: unknown[]) => Promise<void>;
};

function loadEvents(): void {
  const events = [
    readyEvent, interactionCreateEvent, messageDeleteEvent,
    messageUpdateEvent, guildMemberAddEvent,
  ] as unknown as EventModule[];

  for (const event of events) {
    const handler = (...args: unknown[]) => {
      event.execute(client, ...args).catch((err: unknown) => {
        console.error(`[Event Error] ${event.name}:`, err);
      });
    };
    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
    console.log(`[Events] Loaded: ${event.name}`);
  }
}

async function main(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error("DISCORD_TOKEN is not set.");

  await connectDatabase();
  loadCommands();
  loadEvents();
  await client.login(token);
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
