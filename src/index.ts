import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} from "discord.js";
import path from "path";
import fs from "fs";
import { ExtendedClient, BotCommand } from "./types.js";
import { connectDatabase } from "./database.js";

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

async function loadCommands(): Promise<void> {
  const commandsPath = path.join(__dirname, "commands");
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const command = await import(filePath) as BotCommand & { data: BotCommand["data"] };

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`[Commands] Loaded: /${command.data.name}`);
      } else {
        console.warn(`[Commands] Skipped ${file}: missing "data" or "execute".`);
      }
    }
  }
}

async function loadEvents(): Promise<void> {
  const eventsPath = path.join(__dirname, "events");
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

  for (const file of files) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath) as {
      name: string;
      once: boolean;
      execute: (...args: unknown[]) => Promise<void>;
    };

    const handler = (...args: unknown[]) => event.execute(client, ...args);

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
  if (!token) throw new Error("DISCORD_TOKEN is not set in environment variables.");

  await connectDatabase();
  await loadCommands();
  await loadEvents();

  await client.login(token);
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
