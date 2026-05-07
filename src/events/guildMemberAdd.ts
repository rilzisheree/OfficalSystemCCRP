import { Client, GuildMember } from "discord.js";
import { GlobalBan } from "../models/GlobalBan.js";

export const name = "guildMemberAdd";
export const once = false;

export async function execute(client: Client, member: GuildMember): Promise<void> {
  const ban = await GlobalBan.findOne({ userId: member.id });
  if (!ban) return;

  try {
    await member.ban({ reason: `[Global Ban] ${ban.reason}` });
    console.log(`[GlobalBan] Auto-banned ${member.user.tag} in ${member.guild.name}`);
  } catch {
    console.warn(`[GlobalBan] Could not auto-ban ${member.user.tag} in ${member.guild.name}`);
  }
}
