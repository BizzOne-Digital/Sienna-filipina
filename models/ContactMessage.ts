import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    ipHash: String,
  },
  { timestamps: true }
);
ContactMessageSchema.index({ createdAt: -1 });

export type ContactMessageDoc = InferSchemaType<typeof ContactMessageSchema>;
export const ContactMessage: Model<ContactMessageDoc> =
  models.ContactMessage || model("ContactMessage", ContactMessageSchema);
