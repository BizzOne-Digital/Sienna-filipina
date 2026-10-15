// Client-supplied product posters and Reels, served from public/media.
// Posters are shown in the gallery only; they are not shop products.

export type Poster = { src: string; name: string; width: number; height: number };
export type Reel = { src: string; poster: string; label: string };

const g = (slug: string, name: string, width: number, height: number): Poster => ({
  src: `/media/gallery/${slug}.webp`,
  name,
  width,
  height,
});

export const POSTERS: Poster[] = [
  g("gluta-collagen-dtx", "Gluta Collagen DTX+", 900, 1361),
  g("precious-gold-24k-serum", "Precious Gold 24K Serum", 900, 1369),
  g("c9-coffee-thin-gold", "C9 Coffee Thin Gold", 900, 1206),
  g("merry-collagen-peptide-plus", "Merry Collagen Peptide Plus", 900, 1398),
  g("cc-body-sunscreen-spf50", "CC Body Sunscreen SPF 50", 900, 1352),
  g("minako-retinol-booster-serum", "Minako Retinol Booster Serum", 900, 916),
  g("arbutin-3c3-extra-lotion", "Arbutin 3C3 Extra Lotion", 900, 1329),
  g("the-elf-nano-white-booster", "The Elf Nano White Booster", 900, 1227),
  g("c9-capsule", "C9 Capsule", 900, 1200),
  g("gold-eye-roller-serum", "Gold Eye Roller Serum", 900, 1201),
  g("minako-gluta-vitamin-b3-lotion", "Minako Gluta Vitamin B3 Lotion", 900, 1339),
  g("precious-gold-24k-body-serum", "Precious Gold 24K Body Serum", 900, 1345),
  g("alpha-arbutin-collagen-lotion", "Alpha Arbutin Collagen Lotion", 900, 1345),
  g("40x-pro-derm-plus-body-booster", "40X Pro Derm-Plus Body Booster", 900, 1358),
  g("the-elf-nano-white-dose", "The Elf Nano White Dose", 900, 1348),
  g("precious-miracle-serum", "Precious Miracle Serum", 900, 1368),
  g("minako-tomato-lotion", "Minako Tomato Lotion", 900, 1332),
  g("gluta-20x-body-lotion", "Gluta 20X Body Lotion", 900, 1367),
  g("c9-coffee-and-capsule", "C9 Coffee & C9 Capsule", 900, 1081),
  g("chong-du-cocoa-shake", "Chong Du Cocoa Shake", 900, 1122),
  g("minako-tomato-soap", "Minako Tomato Extra Soap", 900, 900),
  g("alada-soap", "Alada Soap", 900, 615),
  g("extra-pure-gluta-soap", "Extra Pure Gluta White Soap", 900, 604),
];

const r = (file: string, posterSlug: string, label: string): Reel => ({
  src: `/media/reels/${file}.mp4`,
  poster: `/media/gallery/${posterSlug}.webp`,
  label,
});

export const REELS: Reel[] = [
  r("reel-1-c9-capsule", "c9-capsule", "C9"),
  r("reel-3-cc-body-sunscreen", "cc-body-sunscreen-spf50", "CC Body Sunscreen"),
  r("reel-5-arbutin-3c3-lotion", "arbutin-3c3-extra-lotion", "Arbutin 3C3 Extra"),
  r("reel-2-c9-cocoa", "chong-du-cocoa-shake", "C9 Chong Du Cocoa"),
  r("reel-4-rice-milk-soap", "extra-pure-gluta-soap", "Rice Milk Soap"),
  r("reel-6-body-lotion", "gluta-20x-body-lotion", "Body Lotion"),
];
