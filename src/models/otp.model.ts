/**
 * Otp model.
 *
 * Follows docs/DATA_RULES.md: optional fields carry `default: "" | false`
 * so older documents never expose `undefined` to API consumers.
 */

import mongoose, { Schema, Document } from "mongoose";

interface IOtp extends Document {
  identifier: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index to automatically purge expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model<IOtp>("Otp", otpSchema);
