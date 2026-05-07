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
async function deployCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    if (!token)
        throw new Error("DISCORD_TOKEN is not set.");
    if (!clientId)
        throw new Error("CLIENT_ID is not set.");
    const commands = [];
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
            if ("data" in command) {
                commands.push(command.data.toJSON());
                console.log(`[Deploy] Queued: /${command.data.toJSON().name}`);
            }
        }
    }
    const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
    console.log(`\n[Deploy] Deploying ${commands.length} command(s) globally...`);
    await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commands });
    console.log(`[Deploy] Successfully deployed ${commands.length} global slash commands.`);
    console.log("[Deploy] Note: Global commands can take up to 1 hour to appear in all servers.");
}
deployCommands().catch((err) => {
    console.error("[Deploy Error]", err);
    process.exit(1);
});
