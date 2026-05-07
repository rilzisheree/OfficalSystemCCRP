"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error("MONGODB_URI is not set in environment variables.");
    mongoose_1.default.connection.on("connected", () => {
        console.log("[Database] Connected to MongoDB.");
    });
    mongoose_1.default.connection.on("error", (err) => {
        console.error("[Database] Connection error:", err);
    });
    mongoose_1.default.connection.on("disconnected", () => {
        console.warn("[Database] Disconnected from MongoDB.");
    });
    await mongoose_1.default.connect(uri);
}
