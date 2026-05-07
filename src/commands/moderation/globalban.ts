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
  .setName("globalban")
  .setDescription("Ban a user from every server the bot is in.")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to globally ban").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("reason")
      .setDescription("Reason for the global ban")
      .setRequired(false)
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
          .setDescription("Only the bot owner can use this command."),
      ],
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(Colors.Error).setDescription("You cannot global ban yourself."),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const existing = await GlobalBan.findOne({ userId: targetUser.id });
  if (existing) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Warning)
          .setDescription(`**${targetUser.tag}** is already globally banned.`),
      ],
    });
    return;
  }

  await GlobalBan.create({
    userId: targetUser.id,
    username: targetUser.tag,
    reason,
    bannedBy: interaction.user.id,
    bannedByUsername: interaction.user.tag,
  });

  const guilds = client.guilds.cache;
  let banned = 0;
  let failed = 0;

  for (const [, guild] of guilds) {
    try {
      await guild.bans.create(targetUser.id, {
        reason: `[Global Ban by ${interaction.user.tag}] ${reason}`,
      });
      banned++;
    } catch {
      failed++;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Default)
    .setTitle("Global Ban Issued")
    .addFields(
      { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
      { name: "Reason", value: reason, inline: true },
      { name: "Banned by", value: interaction.user.tag, inline: true },
      { name: "Servers banned from", value: `${banned}`, inline: true },
      { name: "Failed", value: `${failed}`, inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  await logEvent(client, embed);
}
