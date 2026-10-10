import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, default: "Skincare", trim: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    published: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    isDemo: { type: Boolean, default: false },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type BlogPostDoc = InferSchemaType<typeof BlogPostSchema>;
export const BlogPost: Model<BlogPostDoc> = models.BlogPost || model("BlogPost", BlogPostSchema);
