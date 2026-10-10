// AI-generated editorial concept photography, replaceable from the admin panel.
// These are visual concepts, not verified photographs of the client's inventory.
const image = (name: string) => `/images/sienna/${name}.webp`;

export const STOCK = {
  heroPortrait: image("hero"),
  serumMarble: image("skincare-collection"),
  apparelRack: image("journal-apparel"),
  soapBars: image("rice-soap"),
  soapStack: image("rice-soap-detail"),
  skincareSetPink: image("daily-set"),
  bottlesWhite: image("daily-set"),
  amberBottle: image("skincare-combo"),
  knitTop: image("knit-top"),
  whiteShirt: image("white-shirt"),
  balmJar: image("journal-skincare"),
  serumWood: image("facial-serum"),
  sweaterFlatlay: image("brand-story"),
  apparelCollection: image("apparel-collection"),
  comboBanner: image("combo-banner"),
  comboProduct: image("skincare-combo"),
  brandStory: image("brand-story"),
  journalSkincare: image("journal-skincare"),
  journalApparel: image("journal-apparel"),
  facialSerum: image("facial-serum"),
};

// Resolve only the original demo stock photos, preserving arbitrary admin images.
const LEGACY_IMAGES: Record<string, string> = {
  "1531746020798-e6953c6e8e04": STOCK.heroPortrait,
  "1576426863848-c21f53c60b19": STOCK.serumMarble,
  "1490481651871-ab68de25d43d": STOCK.apparelRack,
  "1600857544200-b2f666a9a2ec": STOCK.soapBars,
  "1607006344380-b6775a0824a7": STOCK.soapStack,
  "1583209814683-c023dd293cc6": STOCK.skincareSetPink,
  "1631729371254-42c2892f0e6e": STOCK.bottlesWhite,
  "1608571423902-eed4a5ad8108": STOCK.amberBottle,
  "1434389677669-e08b4cac3105": STOCK.knitTop,
  "1603252109303-2751441dd157": STOCK.whiteShirt,
  "1599305090598-fe179d501227": STOCK.balmJar,
  "1617897903246-719242758050": STOCK.serumWood,
  "1620799140408-edc6dcb6d633": STOCK.sweaterFlatlay,
};

export function resolveStockImage(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "images.unsplash.com") return src;
    return LEGACY_IMAGES[url.pathname.replace(/^\/photo-/, "")] ?? src;
  } catch {
    return src;
  }
}

export function resolvePageImage(page: string, field: string, src: string): string {
  const resolved = resolveStockImage(src);
  if (resolved === src) return src;
  if (page === "home") {
    if (field === "tile2Image") return STOCK.apparelCollection;
    if (field === "comboImage") return STOCK.comboBanner;
    if (field === "storyImage") return STOCK.brandStory;
  }
  if (page === "services") {
    if (field === "apparelImage") return STOCK.apparelCollection;
    if (field === "comboImage") return STOCK.comboProduct;
  }
  return resolved;
}

export function resolveProductImages(slug: string, images: string[]): string[] {
  return images.map((src, index) => {
    const resolved = resolveStockImage(src);
    if (resolved === src) return src;
    if (slug === "skincare-combo") return index === 0 ? STOCK.comboProduct : STOCK.skincareSetPink;
    if (slug === "glow-facial-serum") return STOCK.facialSerum;
    return resolved;
  });
}
