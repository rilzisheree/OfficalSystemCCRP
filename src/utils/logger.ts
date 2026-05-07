import {
  Client,
  EmbedBuilder,
  TextChannel,
  Message,
  ChatInputCommandInteraction,
} from "discord.js";
import { LogChannel } from "../models/LogChannel.js";
import { Colors } from "./colors.js";

export async function getLogChannel(client: Client): Promise<TextChannel | null> {
  const entry = await LogChannel.findOne({ type: "global" });
  if (!entry) return null;

  try {
    const channel = await client.channels.fetch(entry.channelId);
    if (channel instanceof TextChannel) return channel;
  } catch {
    // Channel may have been deleted
  }
  return null;
}

export async function logEvent(client: Client, embed: EmbedBuilder): Promise<void> {
  const channel = await getLogChannel(client);
  if (!channel) return;

  try {
    await channel.send({ embeds: [embed] });
  } catch {
    // Could not send to log channel
  }
}

export async function logMessageDelete(client: Client, message: Message): Promise<void> {
  if (message.author?.bot) return;
  if (!message.guild) return;

  const embed = new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle("Message Deleted")
    .addFields(
      { name: "Author", value: `${message.author?.tag ?? "Unknown"} (${message.author?.id ?? "?"})`, inline: true },
      { name: "Channel", value: `<#${message.channelId}>`, inline: true },
      { name: "Server", value: message.guild.name, inline: true },
      { name: "Content", value: message.content?.slice(0, 1024) || "*No text content*" }
    )
    .setTimestamp()
    .setFooter({ text: `Message ID: ${message.id}` });

  await logEvent(client, embed);
}

export async function logMessageUpdate(
  client: Client,
  oldMessage: Message,
  newMessage: Message
): Promise<void> {
  if (oldMessage.author?.bot) return;
  if (!oldMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setColor(Colors.Warning)
    .setTitle("Message Edited")
    .addFields(
      { name: "Author", value: `${oldMessage.author?.tag ?? "Unknown"} (${oldMessage.author?.id ?? "?"})`, inline: true },
      { name: "Channel", value: `<#${oldMessage.channelId}>`, inline: true },
      { name: "Server", value: oldMessage.guild.name, inline: true },
      { name: "Before", value: oldMessage.content?.slice(0, 1024) || "*No content*" },
      { name: "After", value: newMessage.content?.slice(0, 1024) || "*No content*" }
    )
    .setURL(newMessage.url)
    .setTimestamp()
    .setFooter({ text: `Message ID: ${oldMessage.id}` });

  await logEvent(client, embed);
}

export async function logCommand(
  client: Client,
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const options: string[] = [];
  interaction.options.data.forEach((opt) => {
    options.push(`${opt.name}: ${opt.value ?? "[subcommand]"}`);
    if (opt.options) {
      opt.options.forEach((sub) => {
        options.push(`  ${sub.name}: ${sub.value}`);
      });
    }
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.Default)
    .setTitle("Command Used")
    .addFields(
      { name: "User", value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: "Command", value: `/${interaction.commandName}`, inline: true },
      {
        name: "Server",
        value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : "DM",
        inline: true,
      },
      {
        name: "Channel",
        value: interaction.channelId ? `<#${interaction.channelId}>` : "Unknown",
        inline: true,
      }
    )
    .setTimestamp();

  if (options.length > 0) {
    embed.addFields({ name: "Options", value: options.join("\n").slice(0, 1024) });
  }

  await logEvent(client, embed);
}
