"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const logger_js_1 = require("../utils/logger.js");
const colors_js_1 = require("../utils/colors.js");
exports.name = "interactionCreate";
exports.once = false;
async function execute(client, interaction) {
    if (!interaction.isChatInputCommand())
        return;
    const extClient = client;
    const command = extClient.commands.get(interaction.commandName);
    if (!command) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(colors_js_1.Colors.Error)
                    .setDescription(`Unknown command: \`/${interaction.commandName}\``),
            ],
            ephemeral: true,
        });
        return;
    }
    try {
        await command.execute(interaction, client);
        await (0, logger_js_1.logCommand)(client, interaction).catch(() => { });
    }
    catch (error) {
        console.error(`[Command Error] /${interaction.commandName}:`, error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setColor(colors_js_1.Colors.Error)
            .setDescription("An unexpected error occurred while running this command.");
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            }
            else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        catch {
            // Could not send error message
        }
    }
}
