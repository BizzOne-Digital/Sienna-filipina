// Client-supplied product posters, served from public/media/gallery.
// The Reels videos are for social media only and are kept out of the site (output/client-media).
// Groups match the shop categories so the gallery and the shop read the same way.

export type Poster = { src: string; name: string; width: number; height: number };
export type PosterGroup = { title: string; category: string; posters: Poster[] };

const g = (slug: string, name: string, width: number, height: number): Poster => ({
  src: `/media/gallery/${slug}.webp`,
  name,
  width,
  height,
});

export const POSTER_GROUPS: PosterGroup[] = [
  {
    title: "Body Serum",
    category: "body-serum",
    posters: [
      g("precious-gold-24k-serum", "Precious Gold 24K Serum", 900, 1369),
      g("precious-gold-24k-body-serum", "Precious Gold 24K Body Serum", 900, 1345),
      g("precious-miracle-serum", "Precious Miracle Serum", 900, 1368),
      g("minako-retinol-booster-serum", "Minako Retinol Booster Serum 50X", 900, 916),
      g("gold-eye-roller-serum", "Gold Eye Roller Serum", 900, 1201),
      g("the-elf-nano-white-dose", "The Elf Nano White Dose", 900, 1348),
    ],
  },
  {
    title: "Body Whitening Lotion",
    category: "body-whitening-lotion",
    posters: [
      g("gluta-20x-body-lotion", "Deli Skin Nano White Gluta 20X", 900, 1367),
      g("minako-gluta-vitamin-b3-lotion", "Minako Tomato Black 10X", 900, 1339),
      g("minako-tomato-lotion", "Minako Tomato Lotion", 900, 1332),
      g("arbutin-3c3-extra-lotion", "Arbutin 3C3 Extra Lotion", 900, 1329),
      g("alpha-arbutin-collagen-lotion", "Alpha Arbutin Collagen Lotion", 900, 1345),
      g("the-elf-nano-white-booster", "The Elf Nano White Booster", 900, 1227),
    ],
  },
  {
    title: "Body Booster",
    category: "body-booster",
    posters: [g("40x-pro-derm-plus-body-booster", "Jennie Moon 40X Body Booster (Red)", 900, 1358)],
  },
  {
    title: "Sunscreen Lotion",
    category: "sunscreen-lotion",
    posters: [
      g("cc-body-sunscreen-spf50", "CC Walnut Body Sunscreen SPF 50 (Green)", 900, 1352),
      g("cc-body-sunscreen-pink", "CC Walnut Body Sunscreen SPF 50 (Pink)", 900, 1343),
    ],
  },
  {
    title: "Whitening Soap",
    category: "whitening-soap",
    posters: [
      g("minako-tomato-soap", "Minako Tomato Soap", 900, 900),
      g("alada-soap", "Alada Soap", 900, 615),
      g("extra-pure-gluta-soap", "Gluta White Soap", 900, 604),
      g("rice-milk-soap", "Rice Milk Soap", 720, 720),
    ],
  },
  {
    title: "Coffee & Cocoa",
    category: "coffee",
    posters: [
      g("c9-coffee-thin-gold", "C9 Coffee", 900, 1206),
      g("chong-du-cocoa-shake", "Cocoa Shake", 900, 1122),
      g("c9-capsule", "C9 Capsule", 900, 1200),
      g("c9-coffee-and-capsule", "C9 Coffee + C9 Capsule Combo", 900, 1081),
    ],
  },
  {
    title: "Collagen Drink",
    category: "collagen-drink",
    posters: [
      g("gluta-collagen-dtx", "DTX Gluta Collagen", 900, 1361),
      g("merry-collagen-peptide-plus", "Merry Collagen Peptide Plus", 900, 1398),
    ],
  },
];

/** Flat list in group order (homepage preview, lightbox). */
export const POSTERS: Poster[] = POSTER_GROUPS.flatMap((grp) => grp.posters);
