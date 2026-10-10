import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 }, // shown only when the admin enters one
    photo: { type: String, default: "" },
    approved: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type TestimonialDoc = InferSchemaType<typeof TestimonialSchema>;
export const Testimonial: Model<TestimonialDoc> =
  models.Testimonial || model("Testimonial", TestimonialSchema);
