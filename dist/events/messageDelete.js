"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const logger_js_1 = require("../utils/logger.js");
exports.name = "messageDelete";
exports.once = false;
async function execute(client, message) {
    if (message.partial) {
        try {
            await message.fetch();
        }
        catch {
            return;
        }
    }
    await (0, logger_js_1.logMessageDelete)(client, message);
}
