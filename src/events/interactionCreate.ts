import { Client, Interaction, EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../types.js";
import { logCommand } from "../utils/logger.js";
import { Colors } from "../utils/colors.js";

export const name = "interactionCreate";
export const once = false;

export async function execute(client: Client, interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const extClient = client as ExtendedClient;
  const command = extClient.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription(`Unknown command: \`/${interaction.commandName}\``),
      ],
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction, client);
    await logCommand(client, interaction).catch(() => {});
  } catch (error) {
    console.error(`[Command Error] /${interaction.commandName}:`, error);

    const errorEmbed = new EmbedBuilder()
      .setColor(Colors.Error)
      .setDescription("An unexpected error occurred while running this command.");

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch {
      // Could not send error message
    }
  }
}
