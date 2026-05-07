"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCommandPermission = hasCommandPermission;
exports.isOwner = isOwner;
const discord_js_1 = require("discord.js");
const AllowUser_js_1 = require("../models/AllowUser.js");
async function hasCommandPermission(interaction, commandName, requiredPermissions = [discord_js_1.PermissionFlagsBits.Administrator]) {
    const member = interaction.member;
    if (!member || !interaction.guildId)
        return false;
    if (member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return true;
    const hasPerms = requiredPermissions.every((perm) => member.permissions.has(perm));
    if (hasPerms)
        return true;
    const allowEntry = await AllowUser_js_1.AllowUser.findOne({
        userId: interaction.user.id,
        guildId: interaction.guildId,
    });
    if (allowEntry && allowEntry.commands.includes(commandName))
        return true;
    return false;
}
function isOwner(userId) {
    return userId === process.env.BOT_OWNER_ID;
}
