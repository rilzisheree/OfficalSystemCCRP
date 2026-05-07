"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const permissions_js_1 = require("../../utils/permissions.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("dm")
    .setDescription("Send a direct message to a user from the bot.")
    .addUserOption((opt) => opt.setName("user").setDescription("The user to DM").setRequired(true))
    .addStringOption((opt) => opt.setName("message").setDescription("The message to send").setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers);
async function execute(interaction, client) {
    const allowed = await (0, permissions_js_1.hasCommandPermission)(interaction, "dm", [
        discord_js_1.PermissionFlagsBits.ModerateMembers,
    ]);
    if (!allowed) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription("You do not have permission to use this command."),
            ],
            ephemeral: true,
        });
        return;
    }
    const targetUser = interaction.options.getUser("user", true);
    const message = interaction.options.getString("message", true);
    if (targetUser.bot) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription("You cannot DM a bot."),
            ],
            ephemeral: true,
        });
        return;
    }
    try {
        const dmEmbed = new discord_js_1.EmbedBuilder()
            .setColor(colors_js_1.Colors.Default)
            .setDescription(message)
            .setFooter({
            text: `Sent from ${interaction.guild?.name ?? "a server"} by ${interaction.user.tag}`,
        })
            .setTimestamp();
        await targetUser.send({ embeds: [dmEmbed] });
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Success)
                    .setDescription(`DM sent to **${targetUser.tag}** successfully.`),
            ],
            ephemeral: true,
        });
    }
    catch {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription(`Could not send a DM to **${targetUser.tag}**. Their DMs may be closed.`),
            ],
            ephemeral: true,
        });
    }
}
