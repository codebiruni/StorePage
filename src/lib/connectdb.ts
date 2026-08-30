/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

// Maintain a cached connection state across serverless function invocations
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDb = async (): Promise<void> => {
  // Defer the env check to runtime so the module can be imported during
  // Next.js build (static page collection) without crashing.
  const mongoUri = process.env.MONGODB_URI as string;

  if (!mongoUri) {
    throw new Error("❌ MongoDB URI is not defined in environment variables.");
  }
  // If a connection is already established and healthy, reuse it instantly
  if (cached.conn) {
    console.log("🚀 MongoDB already connected (using cached connection).");
    return;
  }

  // If a connection attempt is already in progress, wait for it instead of spinning up a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Turn off command buffering to avoid hanging 10-second timeouts on cold starts
    };

    console.log("📡 Initializing a brand new MongoDB connection pool...");
    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB connected successfully");
  } catch (error: any) {
    cached.promise = null; // Clear the broken promise so the next request can try fresh
    console.error("❌ MongoDB connection error:", error.message || error);
    throw error;
  }
};

export default connectDb;