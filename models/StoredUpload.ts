import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Uploaded image bytes. Content documents store only the public URL. */
const StoredUploadSchema = new Schema(
  {
    folder: { type: String, required: true, enum: ["products", "gallery", "pages", "misc"] },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    originalName: { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);
StoredUploadSchema.index({ folder: 1, filename: 1 }, { unique: true });
StoredUploadSchema.index({ createdAt: -1 });

export type StoredUploadDoc = InferSchemaType<typeof StoredUploadSchema>;
export const StoredUpload: Model<StoredUploadDoc> =
  models.StoredUpload || model("StoredUpload", StoredUploadSchema);
