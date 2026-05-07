"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const permissions_js_1 = require("../../utils/permissions.js");
const logger_js_1 = require("../../utils/logger.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("serverlist")
    .setDescription("View all servers the bot is in, with invite links and leave options.")
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
    const guilds = [...client.guilds.cache.values()];
    const pageSize = 5;
    const totalPages = Math.ceil(guilds.length / pageSize);
    let currentPage = 0;
    const buildEmbed = async (page) => {
        const start = page * pageSize;
        const slice = guilds.slice(start, start + pageSize);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(colors_js_1.Colors.Default)
            .setTitle(`Server List — ${guilds.length} servers`)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
            .setTimestamp();
        for (const guild of slice) {
            let inviteUrl = "Could not generate invite";
            try {
                const channels = guild.channels.cache.filter((c) => c instanceof discord_js_1.TextChannel && c.permissionsFor(guild.members.me)?.has(discord_js_1.PermissionFlagsBits.CreateInstantInvite));
                const firstChannel = channels.first();
                if (firstChannel) {
                    const invite = await firstChannel.createInvite({ maxAge: 0, maxUses: 0, unique: false });
                    inviteUrl = invite.url;
                }
            }
            catch {
                // Could not create invite
            }
            embed.addFields({
                name: guild.name,
                value: `**ID:** ${guild.id}\n**Members:** ${guild.memberCount}\n**Owner ID:** ${guild.ownerId}\n**Invite:** ${inviteUrl}`,
            });
        }
        return embed;
    };
    const buildRow = (page) => {
        const start = page * pageSize;
        const slice = guilds.slice(start, start + pageSize);
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
        if (slice.length > 0) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`leave_${slice[0].id}`)
                .setLabel(`Leave ${slice[0].name}`)
                .setStyle(discord_js_1.ButtonStyle.Danger));
        }
        return row;
    };
    const firstEmbed = await buildEmbed(currentPage);
    const reply = await interaction.editReply({
        embeds: [firstEmbed],
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
        else if (btn.customId.startsWith("leave_")) {
            const guildId = btn.customId.replace("leave_", "");
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                const guildName = guild.name;
                try {
                    await guild.leave();
                    guilds.splice(guilds.findIndex((g) => g.id === guildId), 1);
                    const logEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Warning)
                        .setTitle("Bot Left Server")
                        .addFields({ name: "Server", value: `${guildName} (${guildId})`, inline: true }, { name: "Initiated by", value: interaction.user.tag, inline: true })
                        .setTimestamp();
                    await (0, logger_js_1.logEvent)(client, logEmbed);
                    await btn.editReply({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor(colors_js_1.Colors.Warning)
                                .setDescription(`Left server **${guildName}** successfully.`),
                        ],
                        components: [],
                    });
                }
                catch {
                    await btn.editReply({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor(colors_js_1.Colors.Error)
                                .setDescription(`Failed to leave server **${guildName}**.`),
                        ],
                    });
                }
                collector.stop();
                return;
            }
        }
        const embed = await buildEmbed(currentPage);
        await btn.editReply({ embeds: [embed], components: [buildRow(currentPage)] });
    });
    collector.on("end", async () => {
        try {
            await interaction.editReply({ components: [] });
        }
        catch {
            // Expired
        }
    });
}
