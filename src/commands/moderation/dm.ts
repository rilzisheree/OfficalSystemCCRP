import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Colors } from "../../utils/colors.js";
import { hasCommandPermission } from "../../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("dm")
  .setDescription("Send a direct message to a user from the bot.")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to DM").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("message").setDescription("The message to send").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const allowed = await hasCommandPermission(interaction, "dm");
  if (!allowed) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription("You do not have permission to use this command."),
      ],
      flags: 64,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const message = interaction.options.getString("message", true);

  if (targetUser.bot) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription("You cannot DM a bot."),
      ],
      flags: 64,
    });
    return;
  }

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(Colors.Default)
      .setDescription(message)
      .setFooter({
        text: `Sent from ${interaction.guild?.name ?? "a server"} by ${interaction.user.tag}`,
      })
      .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setDescription(`DM sent to **${targetUser.tag}** successfully.`),
      ],
      flags: 64,
    });
  } catch {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription(
            `Could not send a DM to **${targetUser.tag}**. Their DMs may be closed.`
          ),
      ],
      flags: 64,
    });
  }
}
