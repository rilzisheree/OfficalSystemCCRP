import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Colors } from "../../utils/colors.js";
import { AllowUser } from "../../models/AllowUser.js";

const AVAILABLE_COMMANDS = [
  "purge", "say", "dm", "globalban", "unglobalban", "globalbanlist",
  "serverlist", "setlogchannel",
];

export const data = new SlashCommandBuilder()
  .setName("allowuser")
  .setDescription("Manage per-user command permissions.")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Allow a user to use a specific command.")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to grant access to").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("command")
          .setDescription("The command name to allow")
          .setRequired(true)
          .addChoices(...AVAILABLE_COMMANDS.map((c) => ({ name: c, value: c })))
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a user's permission to use a specific command.")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to remove access from").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("command")
          .setDescription("The command name to revoke")
          .setRequired(true)
          .addChoices(...AVAILABLE_COMMANDS.map((c) => ({ name: c, value: c })))
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List all users with granted command permissions in this server.")
  )
  .addSubcommand((sub) =>
    sub
      .setName("check")
      .setDescription("Check which commands a specific user is allowed to use.")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to check").setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
  _client: Client
): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription("You must be an administrator to manage command permissions."),
      ],
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  if (sub === "add") {
    const targetUser = interaction.options.getUser("user", true);
    const command = interaction.options.getString("command", true);

    if (targetUser.bot) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setDescription("You cannot grant permissions to bots."),
        ],
        ephemeral: true,
      });
      return;
    }

    const entry = await AllowUser.findOneAndUpdate(
      { userId: targetUser.id, guildId },
      { $addToSet: { commands: command } },
      { upsert: true, new: true }
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setTitle("Permission Granted")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Command", value: `/${command}`, inline: true },
            { name: "Total allowed commands", value: `${entry.commands.length}`, inline: true }
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  } else if (sub === "remove") {
    const targetUser = interaction.options.getUser("user", true);
    const command = interaction.options.getString("command", true);

    const entry = await AllowUser.findOneAndUpdate(
      { userId: targetUser.id, guildId },
      { $pull: { commands: command } },
      { new: true }
    );

    if (!entry || !entry.commands) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription(`**${targetUser.tag}** had no recorded permissions in this server.`),
        ],
        ephemeral: true,
      });
      return;
    }

    if (entry.commands.length === 0) {
      await AllowUser.deleteOne({ userId: targetUser.id, guildId });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setTitle("Permission Revoked")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Command", value: `/${command}`, inline: true }
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  } else if (sub === "list") {
    const entries = await AllowUser.find({ guildId });

    if (entries.length === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Neutral)
            .setDescription("No custom command permissions have been set in this server."),
        ],
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Default)
      .setTitle("Command Permission List")
      .setFooter({ text: `${entries.length} user(s) with custom permissions` })
      .setTimestamp();

    for (const entry of entries.slice(0, 25)) {
      const cmds = entry.commands.map((c) => `\`/${c}\``).join(", ");
      embed.addFields({
        name: `<@${entry.userId}> (${entry.userId})`,
        value: cmds || "No commands",
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (sub === "check") {
    const targetUser = interaction.options.getUser("user", true);

    const entry = await AllowUser.findOne({ userId: targetUser.id, guildId });

    if (!entry || entry.commands.length === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Neutral)
            .setDescription(`**${targetUser.tag}** has no custom command permissions in this server.`),
        ],
        ephemeral: true,
      });
      return;
    }

    const cmds = entry.commands.map((c) => `\`/${c}\``).join(", ");

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Default)
          .setTitle(`Allowed Commands — ${targetUser.tag}`)
          .setDescription(cmds)
          .setThumbnail(targetUser.displayAvatarURL())
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  }
}
