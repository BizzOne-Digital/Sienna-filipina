import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UploadSessionSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    folder: { type: String, required: true, enum: ["products", "gallery", "pages", "misc"] },
    originalName: { type: String, default: "" },
    declaredType: { type: String, required: true },
    totalSize: { type: Number, required: true },
    chunkSize: { type: Number, required: true },
    totalChunks: { type: Number, required: true },
    status: { type: String, enum: ["open", "completing"], default: "open" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
UploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UploadSessionDoc = InferSchemaType<typeof UploadSessionSchema>;
export const UploadSession: Model<UploadSessionDoc> =
  models.UploadSession || model("UploadSession", UploadSessionSchema);
