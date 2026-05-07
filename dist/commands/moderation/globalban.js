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
    .setName("globalban")
    .setDescription("Ban a user from every server the bot is in.")
    .addUserOption((opt) => opt.setName("user").setDescription("The user to globally ban").setRequired(true))
    .addStringOption((opt) => opt
    .setName("reason")
    .setDescription("Reason for the global ban")
    .setRequired(false))
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
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    if (targetUser.id === interaction.user.id) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder().setColor(colors_js_1.Colors.Error).setDescription("You cannot global ban yourself."),
            ],
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const existing = await GlobalBan_js_1.GlobalBan.findOne({ userId: targetUser.id });
    if (existing) {
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Warning)
                    .setDescription(`**${targetUser.tag}** is already globally banned.`),
            ],
        });
        return;
    }
    await GlobalBan_js_1.GlobalBan.create({
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
        }
        catch {
            failed++;
        }
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colors_js_1.Colors.Default)
        .setTitle("Global Ban Issued")
        .addFields({ name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true }, { name: "Reason", value: reason, inline: true }, { name: "Banned by", value: interaction.user.tag, inline: true }, { name: "Servers banned from", value: `${banned}`, inline: true }, { name: "Failed", value: `${failed}`, inline: true })
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await (0, logger_js_1.logEvent)(client, embed);
}
