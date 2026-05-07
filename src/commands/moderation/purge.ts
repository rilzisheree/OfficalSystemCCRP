import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { Colors } from "../../utils/colors.js";
import { hasCommandPermission } from "../../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Delete a specified number of messages from the channel.")
  .addIntegerOption((opt) =>
    opt
      .setName("amount")
      .setDescription("Number of messages to delete (1-100)")
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("user").setDescription("Only delete messages from this user").setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const allowed = await hasCommandPermission(interaction, "purge");
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

  const amount = interaction.options.getInteger("amount", true);
  const targetUser = interaction.options.getUser("user");
  const channel = interaction.channel as TextChannel;

  await interaction.deferReply({ flags: 64 });

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
        new EmbedBuilder()
          .setColor(Colors.Warning)
          .setDescription("No messages found to delete (messages older than 14 days cannot be bulk deleted)."),
      ],
    });
    return;
  }

  const deleted = await channel.bulkDelete(deletable, true);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Success)
        .setTitle("Purge Complete")
        .addFields(
          { name: "Deleted", value: `${deleted.size} message(s)`, inline: true },
          { name: "Channel", value: `<#${channel.id}>`, inline: true },
          ...(targetUser ? [{ name: "Filtered by", value: `${targetUser.tag}`, inline: true }] : [])
        )
        .setTimestamp(),
    ],
  });
}
