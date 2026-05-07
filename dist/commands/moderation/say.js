"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const colors_js_1 = require("../../utils/colors.js");
const permissions_js_1 = require("../../utils/permissions.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("say")
    .setDescription("Send or edit a message as the bot.")
    .addSubcommand((sub) => sub
    .setName("send")
    .setDescription("Send a message as the bot.")
    .addStringOption((opt) => opt.setName("message").setDescription("The message content to send").setRequired(true))
    .addChannelOption((opt) => opt.setName("channel").setDescription("Target channel (defaults to current)").setRequired(false))
    .addStringOption((opt) => opt
    .setName("reply_to")
    .setDescription("Message ID to reply to")
    .setRequired(false)))
    .addSubcommand((sub) => sub
    .setName("edit")
    .setDescription("Edit an existing bot message.")
    .addStringOption((opt) => opt.setName("message_id").setDescription("ID of the bot message to edit").setRequired(true))
    .addStringOption((opt) => opt.setName("content").setDescription("New content for the message").setRequired(true))
    .addChannelOption((opt) => opt
    .setName("channel")
    .setDescription("Channel the message is in (defaults to current)")
    .setRequired(false)))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
async function execute(interaction, client) {
    const allowed = await (0, permissions_js_1.hasCommandPermission)(interaction, "say", [
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
    const sub = interaction.options.getSubcommand();
    if (sub === "send") {
        const content = interaction.options.getString("message", true);
        const channelOpt = interaction.options.getChannel("channel");
        const replyId = interaction.options.getString("reply_to");
        const targetChannel = (channelOpt
            ? await client.channels.fetch(channelOpt.id)
            : interaction.channel);
        if (!targetChannel || !(targetChannel instanceof discord_js_1.TextChannel)) {
            await interaction.reply({
                embeds: [new discord_js_1.EmbedBuilder().setColor(colors_js_1.Colors.Error).setDescription("Invalid channel.")],
                ephemeral: true,
            });
            return;
        }
        try {
            if (replyId) {
                const replyMsg = await targetChannel.messages.fetch(replyId).catch(() => null);
                if (!replyMsg) {
                    await interaction.reply({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor(colors_js_1.Colors.Error)
                                .setDescription(`Could not find message with ID \`${replyId}\`.`),
                        ],
                        ephemeral: true,
                    });
                    return;
                }
                await replyMsg.reply({ content });
            }
            else {
                await targetChannel.send({ content });
            }
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Success)
                        .setDescription(`Message sent in <#${targetChannel.id}>.`),
                ],
                ephemeral: true,
            });
        }
        catch {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Error)
                        .setDescription("Failed to send message. Check bot permissions."),
                ],
                ephemeral: true,
            });
        }
    }
    else if (sub === "edit") {
        const messageId = interaction.options.getString("message_id", true);
        const newContent = interaction.options.getString("content", true);
        const channelOpt = interaction.options.getChannel("channel");
        const targetChannel = (channelOpt
            ? await client.channels.fetch(channelOpt.id)
            : interaction.channel);
        if (!targetChannel || !(targetChannel instanceof discord_js_1.TextChannel)) {
            await interaction.reply({
                embeds: [new discord_js_1.EmbedBuilder().setColor(colors_js_1.Colors.Error).setDescription("Invalid channel.")],
                ephemeral: true,
            });
            return;
        }
        const msg = await targetChannel.messages.fetch(messageId).catch(() => null);
        if (!msg) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Error)
                        .setDescription(`Could not find message with ID \`${messageId}\`.`),
                ],
                ephemeral: true,
            });
            return;
        }
        if (msg.author.id !== client.user?.id) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Error)
                        .setDescription("I can only edit my own messages."),
                ],
                ephemeral: true,
            });
            return;
        }
        try {
            await msg.edit({ content: newContent });
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Success)
                        .setDescription(`Message edited successfully. [Jump to message](${msg.url})`),
                ],
                ephemeral: true,
            });
        }
        catch {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(colors_js_1.Colors.Error)
                        .setDescription("Failed to edit message."),
                ],
                ephemeral: true,
            });
        }
    }
}
