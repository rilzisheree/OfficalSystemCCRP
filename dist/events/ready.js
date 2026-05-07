"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.name = "ready";
exports.once = true;
async function execute(client) {
    if (!client.user)
        return;
    client.user.setPresence({
        activities: [{ name: "your servers", type: discord_js_1.ActivityType.Watching }],
        status: "dnd",
    });
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);
}
