"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const GlobalBan_js_1 = require("../../models/GlobalBan.js");
const permissions_js_1 = require("../../utils/permissions.js");
const logger_js_1 = require("../../utils/logger.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("globalbanlist")
    .setDescription("View all globally banned users.")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction, client) {
    if (!(0, permissions_js_1.isOwner)(interaction.user.id)) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription("Only the bot owner can use this command."),
            ],
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const bans = await GlobalBan_js_1.GlobalBan.find().sort({ bannedAt: -1 });
    if (bans.length === 0) {
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Neutral)
                    .setDescription("There are no globally banned users."),
            ],
        });
        return;
    }
    const pageSize = 5;
    const totalPages = Math.ceil(bans.length / pageSize);
    let currentPage = 0;
    const buildEmbed = (page) => {
        const start = page * pageSize;
        const slice = bans.slice(start, start + pageSize);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(colors_js_1.Colors.Default)
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
    const buildRow = (page, unbanUserId) => {
        const row = new discord_js_1.ActionRowBuilder();
        if (totalPages > 1) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("prev")
                .setLabel("Previous")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === 0), new discord_js_1.ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === totalPages - 1));
        }
        const currentBans = bans.slice(page * pageSize, page * pageSize + pageSize);
        if (currentBans.length > 0) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`unban_${currentBans[0].userId}`)
                .setLabel(`Unban ${currentBans[0].username}`)
                .setStyle(discord_js_1.ButtonStyle.Danger));
        }
        return row;
    };
    const reply = await interaction.editReply({
        embeds: [buildEmbed(currentPage)],
        components: [buildRow(currentPage)],
    });
    const collector = reply.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 120_000,
        filter: (i) => i.user.id === interaction.user.id,
    });
    collector.on("collect", async (btn) => {
        await btn.deferUpdate();
        if (btn.customId === "prev") {
            currentPage = Math.max(0, currentPage - 1);
        }
        else if (btn.customId === "next") {
            currentPage = Math.min(totalPages - 1, currentPage + 1);
        }
        else if (btn.customId.startsWith("unban_")) {
            const userId = btn.customId.replace("unban_", "");
            const ban = await GlobalBan_js_1.GlobalBan.findOne({ userId });
            if (!ban)
                return;
            await GlobalBan_js_1.GlobalBan.deleteOne({ userId });
            let unbanned = 0;
            for (const [, guild] of client.guilds.cache) {
                try {
                    await guild.bans.remove(userId, `[Global Unban via list by ${interaction.user.tag}]`);
                    unbanned++;
                }
                catch {
                    // Not banned in this guild
                }
            }
            const logEmbed = new discord_js_1.EmbedBuilder()
                .setColor(colors_js_1.Colors.Success)
                .setTitle("Global Ban Removed via List")
                .addFields({ name: "User", value: `${ban.username} (${userId})`, inline: true }, { name: "Unbanned by", value: interaction.user.tag, inline: true }, { name: "Servers unbanned", value: `${unbanned}`, inline: true })
                .setTimestamp();
            await (0, logger_js_1.logEvent)(client, logEmbed);
            bans.splice(bans.findIndex((b) => b.userId === userId), 1);
            await btn.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Success)
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
        }
        catch {
            // Interaction expired
        }
    });
}
