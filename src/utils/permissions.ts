import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { AllowUser } from "../models/AllowUser.js";

export async function hasCommandPermission(
  interaction: ChatInputCommandInteraction,
  commandName: string,
  requiredPermissions: bigint[] = [PermissionFlagsBits.Administrator]
): Promise<boolean> {
  if (isOwner(interaction.user.id)) return true;

  const member = interaction.member as GuildMember | null;
  if (!member || !interaction.guildId) return false;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const hasPerms = requiredPermissions.every((perm) => member.permissions.has(perm));
  if (hasPerms) return true;

  const allowEntry = await AllowUser.findOne({
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });

  if (allowEntry && allowEntry.commands.includes(commandName)) return true;

  return false;
}

export function getOwnerIds(): string[] {
  const raw = process.env.BOT_OWNER_IDS ?? process.env.BOT_OWNER_ID ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function isOwner(userId: string): boolean {
  return getOwnerIds().includes(userId);
}
