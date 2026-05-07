import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Colors } from "../../utils/colors.js";
import { GlobalBan } from "../../models/GlobalBan.js";
import { isOwner } from "../../utils/permissions.js";
import { logEvent } from "../../utils/logger.js";

export const data = new SlashCommandBuilder()
  .setName("unglobalban")
  .setDescription("Remove a user's global ban.")
  .addStringOption((opt) =>
    opt
      .setName("user_id")
      .setDescription("The user ID to un-globally ban")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription(`Only the bot owner can use this command.\n\n**Your ID:** \`${interaction.user.id}\`\nAdd this to \`BOT_OWNER_IDS\` in Railway if this is you.`),
      ],
      flags: 64,
    });
    return;
  }

  const userId = interaction.options.getString("user_id", true).trim();
  await interaction.deferReply({ flags: 64 });

  const ban = await GlobalBan.findOne({ userId });
  if (!ban) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Warning)
          .setDescription(`No global ban found for user ID \`${userId}\`.`),
      ],
    });
    return;
  }

  await GlobalBan.deleteOne({ userId });

  const guilds = client.guilds.cache;
  let unbanned = 0;
  let failed = 0;

  for (const [, guild] of guilds) {
    try {
      await guild.bans.remove(userId, `[Global Unban by ${interaction.user.tag}]`);
      unbanned++;
    } catch {
      failed++;
    }
  }

  let resolvedTag = ban.username;
  try {
    const resolved = await client.users.fetch(userId);
    resolvedTag = resolved.tag;
  } catch {
    // User not found
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle("Global Ban Removed")
    .addFields(
      { name: "User", value: `${resolvedTag} (${userId})`, inline: true },
      { name: "Original reason", value: ban.reason, inline: true },
      { name: "Unbanned by", value: interaction.user.tag, inline: true },
      { name: "Servers unbanned from", value: `${unbanned}`, inline: true },
      { name: "Failed", value: `${failed}`, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  await logEvent(client, embed);
}
