"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const GlobalBan_js_1 = require("../models/GlobalBan.js");
exports.name = "guildMemberAdd";
exports.once = false;
async function execute(client, member) {
    const ban = await GlobalBan_js_1.GlobalBan.findOne({ userId: member.id });
    if (!ban)
        return;
    try {
        await member.ban({ reason: `[Global Ban] ${ban.reason}` });
        console.log(`[GlobalBan] Auto-banned ${member.user.tag} in ${member.guild.name}`);
    }
    catch {
        console.warn(`[GlobalBan] Could not auto-ban ${member.user.tag} in ${member.guild.name}`);
    }
}
