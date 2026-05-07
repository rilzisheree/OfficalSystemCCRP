import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { AllowUser } from "../models/AllowUser.js";

// Add your Discord user IDs here:
const OWNER_IDS: string[] = [
  "424314513211392001",
  "523213302860349450",
];

export function getOwnerIds(): string[] {
  const fromEnv = (process.env.BOT_OWNER_IDS ?? process.env.BOT_OWNER_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return [...new Set([...OWNER_IDS, ...fromEnv])];
}

export function isOwner(userId: string): boolean {
  return getOwnerIds().includes(userId);
}

export async function hasCommandPermission(
  interaction: ChatInputCommandInteraction,
  commandName: string
): Promise<boolean> {
  if (isOwner(interaction.user.id)) return true;

  if (!interaction.guildId) return false;

  const allowEntry = await AllowUser.findOne({
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  return !!(allowEntry && allowEntry.commands.includes(commandName));
}
