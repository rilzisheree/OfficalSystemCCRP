"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_js_1 = require("./database.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildBans,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.GuildMember],
});
client.commands = new discord_js_1.Collection();
async function loadCommands() {
    const commandsPath = path_1.default.join(__dirname, "commands");
    const categories = fs_1.default.readdirSync(commandsPath);
    for (const category of categories) {
        const categoryPath = path_1.default.join(commandsPath, category);
        if (!fs_1.default.statSync(categoryPath).isDirectory())
            continue;
        const files = fs_1.default.readdirSync(categoryPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
        for (const file of files) {
            const filePath = path_1.default.join(categoryPath, file);
            const command = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
            if ("data" in command && "execute" in command) {
                client.commands.set(command.data.name, command);
                console.log(`[Commands] Loaded: /${command.data.name}`);
            }
            else {
                console.warn(`[Commands] Skipped ${file}: missing "data" or "execute".`);
            }
        }
    }
}
async function loadEvents() {
    const eventsPath = path_1.default.join(__dirname, "events");
    const files = fs_1.default.readdirSync(eventsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
    for (const file of files) {
        const filePath = path_1.default.join(eventsPath, file);
        const event = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
        const handler = (...args) => event.execute(client, ...args);
        if (event.once) {
            client.once(event.name, handler);
        }
        else {
            client.on(event.name, handler);
        }
        console.log(`[Events] Loaded: ${event.name}`);
    }
}
async function main() {
    const token = process.env.DISCORD_TOKEN;
    if (!token)
        throw new Error("DISCORD_TOKEN is not set in environment variables.");
    await (0, database_js_1.connectDatabase)();
    await loadCommands();
    await loadEvents();
    await client.login(token);
}
main().catch((err) => {
    console.error("[Fatal]", err);
    process.exit(1);
});
