import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} from "discord.js";
import { Colors } from "../../utils/colors.js";
import { GlobalBan } from "../../models/GlobalBan.js";
import { isOwner } from "../../utils/permissions.js";
import { logEvent } from "../../utils/logger.js";

export const data = new SlashCommandBuilder()
  .setName("globalbanlist")
  .setDescription("View all globally banned users.")
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

  await interaction.deferReply({ flags: 64 });

  const bans = await GlobalBan.find().sort({ bannedAt: -1 });

  if (bans.length === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Neutral)
          .setDescription("There are no globally banned users."),
      ],
    });
    return;
  }

  const pageSize = 5;
  const totalPages = Math.ceil(bans.length / pageSize);
  let currentPage = 0;

  const buildEmbed = (page: number): EmbedBuilder => {
    const start = page * pageSize;
    const slice = bans.slice(start, start + pageSize);

    const embed = new EmbedBuilder()
      .setColor(Colors.Default)
      .setTitle(`Global Ban List — ${bans.length} total`)
      .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
      .setTimestamp();

    for (const ban of slice) {
      embed.addFields({
        name: `${ban.username} (${ban.userId})`,
        value: `**Reason:** ${ban.reason}\n**Banned by:** ${ban.bannedByUsername}\n**Date:** <t:${Math.floor(ban.bannedAt.getTime() / 1000)}:R>`,
      });
    }

    return embed;
  };

  const buildRow = (page: number, unbanUserId?: string): ActionRowBuilder<ButtonBuilder> => {
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (totalPages > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    }

    const currentBans = bans.slice(page * pageSize, page * pageSize + pageSize);
    if (currentBans.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`unban_${currentBans[0].userId}`)
          .setLabel(`Unban ${currentBans[0].username}`)
          .setStyle(ButtonStyle.Danger)
      );
    }

    return row;
  };

  const reply = await interaction.editReply({
    embeds: [buildEmbed(currentPage)],
    components: [buildRow(currentPage)],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on("collect", async (btn) => {
    await btn.deferUpdate();

    if (btn.customId === "prev") {
      currentPage = Math.max(0, currentPage - 1);
    } else if (btn.customId === "next") {
      currentPage = Math.min(totalPages - 1, currentPage + 1);
    } else if (btn.customId.startsWith("unban_")) {
      const userId = btn.customId.replace("unban_", "");
      const ban = await GlobalBan.findOne({ userId });
      if (!ban) return;

      await GlobalBan.deleteOne({ userId });

      let unbanned = 0;
      for (const [, guild] of client.guilds.cache) {
        try {
          await guild.bans.remove(userId, `[Global Unban via list by ${interaction.user.tag}]`);
          unbanned++;
        } catch {
          // Not banned in this guild
        }
      }

      const logEmbed = new EmbedBuilder()
        .setColor(Colors.Success)
        .setTitle("Global Ban Removed via List")
        .addFields(
          { name: "User", value: `${ban.username} (${userId})`, inline: true },
          { name: "Unbanned by", value: interaction.user.tag, inline: true },
          { name: "Servers unbanned", value: `${unbanned}`, inline: true }
        )
        .setTimestamp();

      await logEvent(client, logEmbed);

      bans.splice(
        bans.findIndex((b) => b.userId === userId),
        1
      );

      await btn.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Success)
            .setDescription(`**${ban.username}** has been globally unbanned from ${unbanned} server(s).`),
        ],
        components: [],
      });
      collector.stop();
      return;
    }

    await btn.editReply({
      embeds: [buildEmbed(currentPage)],
      components: [buildRow(currentPage)],
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch {
      // Interaction expired
    }
  });
}
