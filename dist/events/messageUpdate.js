"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const logger_js_1 = require("../utils/logger.js");
exports.name = "messageUpdate";
exports.once = false;
async function execute(client, oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial)
        return;
    await (0, logger_js_1.logMessageUpdate)(client, oldMessage, newMessage);
}
