"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const permissions_js_1 = require("../../utils/permissions.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete a specified number of messages from the channel.")
    .addIntegerOption((opt) => opt
    .setName("amount")
    .setDescription("Number of messages to delete (1-100)")
    .setMinValue(1)
    .setMaxValue(100)
    .setRequired(true))
    .addUserOption((opt) => opt.setName("user").setDescription("Only delete messages from this user").setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
async function execute(interaction, client) {
    const allowed = await (0, permissions_js_1.hasCommandPermission)(interaction, "purge", [
        discord_js_1.PermissionFlagsBits.ManageMessages,
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
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");
    const channel = interaction.channel;
    await interaction.deferReply({ ephemeral: true });
    let messages = await channel.messages.fetch({ limit: 100 });
    if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
    }
    const toDelete = [...messages.values()].slice(0, amount);
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletable = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);
    if (deletable.length === 0) {
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Warning)
                    .setDescription("No messages found to delete (messages older than 14 days cannot be bulk deleted)."),
            ],
        });
        return;
    }
    const deleted = await channel.bulkDelete(deletable, true);
    await interaction.editReply({
        embeds: [
            new discord_js_1.EmbedBuilder()
                .setColor(colors_js_1.Colors.Success)
                .setTitle("Purge Complete")
                .addFields({ name: "Deleted", value: `${deleted.size} message(s)`, inline: true }, { name: "Channel", value: `<#${channel.id}>`, inline: true }, ...(targetUser ? [{ name: "Filtered by", value: `${targetUser.tag}`, inline: true }] : []))
                .setTimestamp(),
        ],
    });
}
