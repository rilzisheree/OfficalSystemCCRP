"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const LogChannel_js_1 = require("../../models/LogChannel.js");
const permissions_js_1 = require("../../utils/permissions.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("setlogchannel")
    .setDescription("Manage the global log channel.")
    .addSubcommand((sub) => sub
    .setName("setglobal")
    .setDescription("Set the current channel as the global log channel (logs events from ALL servers)."))
    .addSubcommand((sub) => sub
    .setName("remove")
    .setDescription("Remove the current global log channel."))
    .addSubcommand((sub) => sub
    .setName("check")
    .setDescription("Check the current global log channel."))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction, client) {
    if (!(0, permissions_js_1.isOwner)(interaction.user.id)) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription("Only the bot owner can manage the global log channel."),
            ],
            ephemeral: true,
        });
        return;
    }
    const sub = interaction.options.getSubcommand();
    if (sub === "setglobal") {
        const channel = interaction.channel;
        await LogChannel_js_1.LogChannel.findOneAndUpdate({ type: "global" }, { channelId: channel.id, guildId: interaction.guildId, type: "global" }, { upsert: true, new: true });
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Success)
                    .setTitle("Global Log Channel Set")
                    .setDescription(`<#${channel.id}> is now the global log channel.\n\nThis channel will receive logs for:\n- Message deletions (all servers)\n- Message edits (all servers)\n- Commands used (all servers)\n- Global bans/unbans`)
                    .addFields({ name: "Channel", value: `<#${channel.id}>`, inline: true }, { name: "Server", value: interaction.guild?.name ?? "Unknown", inline: true })
                    .setTimestamp(),
            ],
        });
    }
    else if (sub === "remove") {
        const existing = await LogChannel_js_1.LogChannel.findOne({ type: "global" });
        if (!existing) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Warning)
                        .setDescription("There is no global log channel configured."),
                ],
                ephemeral: true,
            });
            return;
        }
        await LogChannel_js_1.LogChannel.deleteOne({ type: "global" });
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Success)
                    .setDescription("The global log channel has been removed. No events will be logged."),
            ],
            ephemeral: true,
        });
    }
    else if (sub === "check") {
        const existing = await LogChannel_js_1.LogChannel.findOne({ type: "global" });
        if (!existing) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Neutral)
                        .setDescription("No global log channel is currently configured."),
                ],
                ephemeral: true,
            });
            return;
        }
        let channelMention = `<#${existing.channelId}>`;
        let guildName = "Unknown server";
        let status = "Active";
        try {
            const ch = await client.channels.fetch(existing.channelId);
            if (!(ch instanceof discord_js_1.TextChannel)) {
                status = "Invalid (not a text channel)";
            }
        }
        catch {
            status = "Unreachable (channel may have been deleted)";
        }
        try {
            const guild = await client.guilds.fetch(existing.guildId);
            guildName = guild.name;
        }
        catch {
            // Could not fetch guild
        }
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Default)
                    .setTitle("Global Log Channel")
                    .addFields({ name: "Channel", value: channelMention, inline: true }, { name: "Server", value: guildName, inline: true }, { name: "Status", value: status, inline: true })
                    .setTimestamp(),
            ],
            ephemeral: true,
        });
    }
}
