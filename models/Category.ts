import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isCombo: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category: Model<CategoryDoc> = models.Category || model("Category", CategorySchema);
