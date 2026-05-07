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
    .setName("unglobalban")
    .setDescription("Remove a user's global ban.")
    .addStringOption((opt) => opt
    .setName("user_id")
    .setDescription("The user ID to un-globally ban")
    .setRequired(true))
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
    const userId = interaction.options.getString("user_id", true).trim();
    await interaction.deferReply({ ephemeral: true });
    const ban = await GlobalBan_js_1.GlobalBan.findOne({ userId });
    if (!ban) {
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Warning)
                    .setDescription(`No global ban found for user ID \`${userId}\`.`),
            ],
        });
        return;
    }
    await GlobalBan_js_1.GlobalBan.deleteOne({ userId });
    const guilds = client.guilds.cache;
    let unbanned = 0;
    let failed = 0;
    for (const [, guild] of guilds) {
        try {
            await guild.bans.remove(userId, `[Global Unban by ${interaction.user.tag}]`);
            unbanned++;
        }
        catch {
            failed++;
        }
    }
    let resolvedTag = ban.username;
    try {
        const resolved = await client.users.fetch(userId);
        resolvedTag = resolved.tag;
    }
    catch {
        // User not found
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colors_js_1.Colors.Success)
        .setTitle("Global Ban Removed")
        .addFields({ name: "User", value: `${resolvedTag} (${userId})`, inline: true }, { name: "Original reason", value: ban.reason, inline: true }, { name: "Unbanned by", value: interaction.user.tag, inline: true }, { name: "Servers unbanned from", value: `${unbanned}`, inline: true }, { name: "Failed", value: `${failed}`, inline: true })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    await (0, logger_js_1.logEvent)(client, embed);
}
