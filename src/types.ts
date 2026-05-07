import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  Collection,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export interface BotCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  requiredPermissions?: bigint[];
}

export interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}

export type CommandJSON = RESTPostAPIChatInputApplicationCommandsJSONBody;
