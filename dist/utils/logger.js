"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogChannel = getLogChannel;
exports.logEvent = logEvent;
exports.logMessageDelete = logMessageDelete;
exports.logMessageUpdate = logMessageUpdate;
exports.logCommand = logCommand;
const discord_js_1 = require("discord.js");
const LogChannel_js_1 = require("../models/LogChannel.js");
const colors_js_1 = require("./colors.js");
async function getLogChannel(client) {
    const entry = await LogChannel_js_1.LogChannel.findOne({ type: "global" });
    if (!entry)
        return null;
    try {
        const channel = await client.channels.fetch(entry.channelId);
        if (channel instanceof discord_js_1.TextChannel)
            return channel;
    }
    catch {
        // Channel may have been deleted
    }
    return null;
}
async function logEvent(client, embed) {
    const channel = await getLogChannel(client);
    if (!channel)
        return;
    try {
        await channel.send({ embeds: [embed] });
    }
    catch {
        // Could not send to log channel
    }
}
async function logMessageDelete(client, message) {
    if (message.author?.bot)
        return;
    if (!message.guild)
        return;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colors_js_1.Colors.Error)
        .setTitle("Message Deleted")
        .addFields({ name: "Author", value: `${message.author?.tag ?? "Unknown"} (${message.author?.id ?? "?"})`, inline: true }, { name: "Channel", value: `<#${message.channelId}>`, inline: true }, { name: "Server", value: message.guild.name, inline: true }, { name: "Content", value: message.content?.slice(0, 1024) || "*No text content*" })
        .setTimestamp()
        .setFooter({ text: `Message ID: ${message.id}` });
    await logEvent(client, embed);
}
async function logMessageUpdate(client, oldMessage, newMessage) {
    if (oldMessage.author?.bot)
        return;
    if (!oldMessage.guild)
        return;
    if (oldMessage.content === newMessage.content)
        return;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colors_js_1.Colors.Warning)
        .setTitle("Message Edited")
        .addFields({ name: "Author", value: `${oldMessage.author?.tag ?? "Unknown"} (${oldMessage.author?.id ?? "?"})`, inline: true }, { name: "Channel", value: `<#${oldMessage.channelId}>`, inline: true }, { name: "Server", value: oldMessage.guild.name, inline: true }, { name: "Before", value: oldMessage.content?.slice(0, 1024) || "*No content*" }, { name: "After", value: newMessage.content?.slice(0, 1024) || "*No content*" })
        .setURL(newMessage.url)
        .setTimestamp()
        .setFooter({ text: `Message ID: ${oldMessage.id}` });
    await logEvent(client, embed);
}
async function logCommand(client, interaction) {
    const options = [];
    interaction.options.data.forEach((opt) => {
        options.push(`${opt.name}: ${opt.value ?? "[subcommand]"}`);
        if (opt.options) {
            opt.options.forEach((sub) => {
                options.push(`  ${sub.name}: ${sub.value}`);
            });
        }
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colors_js_1.Colors.Default)
        .setTitle("Command Used")
        .addFields({ name: "User", value: `${interaction.user.tag} (${interaction.user.id})`, inline: true }, { name: "Command", value: `/${interaction.commandName}`, inline: true }, {
        name: "Server",
        value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : "DM",
        inline: true,
    }, {
        name: "Channel",
        value: interaction.channelId ? `<#${interaction.channelId}>` : "Unknown",
        inline: true,
    })
        .setTimestamp();
    if (options.length > 0) {
        embed.addFields({ name: "Options", value: options.join("\n").slice(0, 1024) });
    }
    await logEvent(client, embed);
}
