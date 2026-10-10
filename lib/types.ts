// Plain JSON shapes passed from server components to the client.

export type CategoryDTO = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isCombo: boolean;
  sortOrder: number;
};

export type VariantDTO = { _id: string; name: string; sku: string; priceCents?: number; stock: number };

export type ProductDTO = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  priceLabel: string;
  images: string[];
  category: CategoryDTO | null;
  stock: number;
  variants: VariantDTO[];
  badge: string;
  comboOffer: string;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

export type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  publishedAt?: string;
  seoTitle: string;
  seoDescription: string;
};

export type SettingsDTO = {
  siteName: string;
  tagline: string;
  logo: string;
  announcement: string;
  announcementEnabled: boolean;
  email: string;
  phone: string;
  showPhone: boolean;
  businessHours: { label: string; value: string }[];
  facebookUrl: string;
  instagramUrl: string;
  comboOfferText: string;
  shippingNote: string;
  seoTitle: string;
  seoDescription: string;
};

export type TestimonialDTO = { _id: string; name: string; location: string; quote: string; rating?: number; photo: string };
export type TeamMemberDTO = { _id: string; name: string; role: string; bio: string; photo: string };
