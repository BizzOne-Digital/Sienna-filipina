import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Editable copy and images for a page, keyed by page ("home", "about", ...). */
const PageContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, default: {} },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true, minimize: false }
);

export type PageContentDoc = InferSchemaType<typeof PageContentSchema>;
export const PageContent: Model<PageContentDoc> =
  models.PageContent || model("PageContent", PageContentSchema);
