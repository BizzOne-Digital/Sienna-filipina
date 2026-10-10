import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Fixed-window counters shared by every serverless instance (login, contact, checkout). */
const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDoc = InferSchemaType<typeof RateLimitSchema>;
export const RateLimit: Model<RateLimitDoc> = models.RateLimit || model("RateLimit", RateLimitSchema);
