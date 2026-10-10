import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const HoursSchema = new Schema({ label: String, value: String }, { _id: false });

/** Singleton document (key: "site"). */
const SiteSettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    siteName: { type: String, default: "Sienna Filipina" },
    tagline: { type: String, default: "Skincare & Apparel" },
    logo: { type: String, default: "" },
    announcement: { type: String, default: "" },
    announcementEnabled: { type: Boolean, default: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    showPhone: { type: Boolean, default: false },
    businessHours: { type: [HoursSchema], default: [] },
    facebookUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    comboOfferText: { type: String, default: "" },
    shippingNote: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema>;
export const SiteSettings: Model<SiteSettingsDoc> =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);
