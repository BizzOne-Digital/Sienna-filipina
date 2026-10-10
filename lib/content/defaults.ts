import type { SettingsDTO } from "@/lib/types";

/** Business information supplied for launch. Admin edits in SiteSettings override these. */
export const DEFAULT_SETTINGS: SettingsDTO = {
  siteName: "Sienna Filipina",
  tagline: "Skincare & Apparel",
  logo: "",
  announcement: "A little extra glow — free rice soap with combo purchases",
  announcementEnabled: true,
  email: "analynpitogo1@gmail.com",
  phone: "8174804576",
  showPhone: false,
  businessHours: [],
  facebookUrl: "",
  instagramUrl: "",
  comboOfferText: "Free rice soap with every combo purchase.",
  shippingNote: "",
  seoTitle: "Sienna Filipina — Skincare & Apparel",
  seoDescription:
    "Shop skincare essentials and everyday apparel from Sienna Filipina. Classy, modern and minimalist — with a free rice soap on combo purchases.",
};
