import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UploadChunkSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "UploadSession", required: true },
  index: { type: Number, required: true, min: 0 },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true },
  expiresAt: { type: Date, required: true },
});
UploadChunkSchema.index({ session: 1, index: 1 }, { unique: true });
UploadChunkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UploadChunkDoc = InferSchemaType<typeof UploadChunkSchema>;
export const UploadChunk: Model<UploadChunkDoc> =
  models.UploadChunk || model("UploadChunk", UploadChunkSchema);
