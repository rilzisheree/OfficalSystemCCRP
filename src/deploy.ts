import "dotenv/config";
import { REST, Routes } from "discord.js";
import path from "path";
import fs from "fs";
import { CommandJSON } from "./types.js";

async function deployCommands(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;

  if (!token) throw new Error("DISCORD_TOKEN is not set.");
  if (!clientId) throw new Error("CLIENT_ID is not set.");

  const commands: CommandJSON[] = [];
  const commandsPath = path.join(__dirname, "commands");
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const command = await import(filePath) as { data: { toJSON: () => CommandJSON } };

      if ("data" in command) {
        commands.push(command.data.toJSON());
        console.log(`[Deploy] Queued: /${command.data.toJSON().name}`);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(token);

  console.log(`\n[Deploy] Deploying ${commands.length} command(s) globally...`);

  await rest.put(Routes.applicationCommands(clientId), { body: commands });

  console.log(`[Deploy] Successfully deployed ${commands.length} global slash commands.`);
  console.log("[Deploy] Note: Global commands can take up to 1 hour to appear in all servers.");
}

deployCommands().catch((err) => {
  console.error("[Deploy Error]", err);
  process.exit(1);
});
