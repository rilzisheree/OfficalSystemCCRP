import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in environment variables.");

  mongoose.connection.on("connected", () => {
    console.log("[Database] Connected to MongoDB.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[Database] Connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[Database] Disconnected from MongoDB.");
  });

  await mongoose.connect(uri);
}
