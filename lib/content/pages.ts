import { STOCK } from "./images";

export type PageField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "image";
  help?: string;
};

export type PageDef = {
  key: string;
  label: string;
  path: string;
  sections: { title: string; fields: PageField[] }[];
  defaults: Record<string, string>;
};

const t = (name: string, label: string, help?: string): PageField => ({ name, label, type: "text", help });
const ta = (name: string, label: string, help?: string): PageField => ({ name, label, type: "textarea", help });
const img = (name: string, label: string): PageField => ({ name, label, type: "image" });

const simple = (key: string, label: string, path: string, heading: string, intro: string): PageDef => ({
  key,
  label,
  path,
  sections: [{ title: "Page header", fields: [t("eyebrow", "Eyebrow"), t("heading", "Heading"), ta("intro", "Introduction")] }],
  defaults: { eyebrow: "Sienna Filipina", heading, intro },
});

export const PAGE_DEFS: PageDef[] = [
  {
    key: "home",
    label: "Homepage",
    path: "/",
    sections: [
      {
        title: "Hero",
        fields: [
          t("heroEyebrow", "Eyebrow"),
          t("heroHeading", "Heading", "Use a full stop to split onto two lines, e.g. \"Your glow. Your style.\""),
          ta("heroDescription", "Description"),
          t("heroPrimaryLabel", "Primary button"),
          t("heroSecondaryLabel", "Secondary button"),
          img("heroImage", "Hero image"),
          t("heroImageAlt", "Hero image description (alt text)"),
        ],
      },
      {
        title: "Collection tiles",
        fields: [
          t("tile1Title", "Tile 1 title"),
          ta("tile1Text", "Tile 1 text"),
          t("tile1Button", "Tile 1 button"),
          img("tile1Image", "Tile 1 image"),
          t("tile2Title", "Tile 2 title"),
          ta("tile2Text", "Tile 2 text"),
          t("tile2Button", "Tile 2 button"),
          img("tile2Image", "Tile 2 image"),
        ],
      },
      {
        title: "Featured products",
        fields: [t("collectionEyebrow", "Eyebrow"), t("collectionHeading", "Heading"), t("collectionSubheading", "Subheading")],
      },
      {
        title: "Combo promotion",
        fields: [t("comboHeading", "Heading"), ta("comboText", "Text"), t("comboButton", "Button"), img("comboImage", "Image")],
      },
      {
        title: "Brand story",
        fields: [
          t("storyEyebrow", "Eyebrow"),
          t("storyHeading", "Heading"),
          t("storyLead", "Lead line"),
          ta("storyBody", "Body"),
          t("storyButton", "Button"),
          img("storyImage", "Image"),
        ],
      },
      { title: "Journal preview", fields: [t("journalEyebrow", "Eyebrow"), t("journalHeading", "Heading")] },
    ],
    defaults: {
      heroEyebrow: "Skincare & Apparel",
      heroHeading: "Your glow. Your style.",
      heroDescription: "Discover skincare and everyday pieces, thoughtfully selected for you.",
      heroPrimaryLabel: "Shop Skincare",
      heroSecondaryLabel: "Explore Apparel",
      heroImage: STOCK.heroPortrait,
      heroImageAlt: "Filipina beauty portrait with rose gold skincare bottles, rice soap and blush silk",
      tile1Title: "Skincare Essentials",
      tile1Text: "Nourish your natural glow with thoughtfully curated skincare.",
      tile1Button: "Shop Skincare",
      tile1Image: STOCK.serumMarble,
      tile2Title: "Everyday Apparel",
      tile2Text: "Elegant, versatile pieces for your everyday story.",
      tile2Button: "Shop Apparel",
      tile2Image: STOCK.apparelCollection,
      collectionEyebrow: "Our Collection",
      collectionHeading: "Little luxuries, everyday.",
      collectionSubheading: "Explore the collection",
      comboHeading: "Your routine, beautifully paired.",
      comboText: "Skincare and apparel, made for your everyday glow.",
      comboButton: "Shop Combos",
      comboImage: STOCK.comboBanner,
      storyEyebrow: "Our Story",
      storyHeading: "Beauty in the everyday.",
      storyLead: "Skincare and apparel for your everyday rituals.",
      storyBody:
        "Sienna Filipina brings together skincare and apparel chosen to fit easily into everyday life — simple, graceful, and made to be enjoyed.",
      storyButton: "About Sienna Filipina",
      storyImage: STOCK.brandStory,
      journalEyebrow: "The Sienna Journal",
      journalHeading: "Inspiration for your everyday glow.",
    },
  },
  {
    key: "about",
    label: "About Us",
    path: "/about-us",
    sections: [
      { title: "Header", fields: [t("eyebrow", "Eyebrow"), t("heading", "Heading"), ta("intro", "Introduction"), img("heroImage", "Header image")] },
      {
        title: "Story",
        fields: [t("storyHeading", "Story heading"), ta("storyBody", "Story body (blank line = new paragraph)"), img("storyImage", "Story image")],
      },
      { title: "What we offer", fields: [t("offerHeading", "Heading"), ta("offerBody", "Body")] },
    ],
    defaults: {
      eyebrow: "About Us",
      heading: "Beauty in the everyday.",
      intro: "Sienna Filipina is an online boutique for skincare and apparel, created for women of all ages.",
      heroImage: STOCK.serumWood,
      storyHeading: "Skincare & apparel, together",
      storyBody:
        "We bring together skincare essentials and everyday apparel in one simple place to shop.\n\nOur aim is a classy, modern and minimalist collection that is easy to choose from and easy to enjoy.",
      storyImage: STOCK.sweaterFlatlay,
      offerHeading: "What you will find here",
      offerBody:
        "Skincare essentials, everyday apparel, and combos that pair the two — with a free rice soap included on combo purchases.",
    },
  },
  {
    key: "services",
    label: "Services",
    path: "/services",
    sections: [
      { title: "Header", fields: [t("eyebrow", "Eyebrow"), t("heading", "Heading"), ta("intro", "Introduction")] },
      {
        title: "Offerings",
        fields: [
          t("skincareTitle", "Skincare title"),
          ta("skincareText", "Skincare text"),
          img("skincareImage", "Skincare image"),
          t("apparelTitle", "Apparel title"),
          ta("apparelText", "Apparel text"),
          img("apparelImage", "Apparel image"),
          t("comboTitle", "Combos title"),
          ta("comboText", "Combos text"),
          img("comboImage", "Combos image"),
        ],
      },
      { title: "How ordering works", fields: [ta("orderingText", "Ordering steps (one per line)")] },
    ],
    defaults: {
      eyebrow: "Services",
      heading: "Shop skincare and apparel online",
      intro: "Browse, choose and order from home. Here is what Sienna Filipina offers.",
      skincareTitle: "Skincare",
      skincareText: "Everyday skincare essentials, from rice soap to complete daily sets.",
      skincareImage: STOCK.bottlesWhite,
      apparelTitle: "Apparel",
      apparelText: "Elegant, versatile everyday pieces in soft, neutral tones.",
      apparelImage: STOCK.apparelCollection,
      comboTitle: "Combos",
      comboText: "Curated pairings at a combined price, each including a free rice soap.",
      comboImage: STOCK.comboProduct,
      orderingText:
        "Add your favourite items to the bag.\nPlace your order at checkout.\nWe contact you by email to confirm payment and delivery details.\nYour order is prepared and sent to you.",
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    path: "/pricing",
    sections: [{ title: "Header", fields: [t("eyebrow", "Eyebrow"), t("heading", "Heading"), ta("intro", "Introduction"), ta("note", "Note below price list")] }],
    defaults: {
      eyebrow: "Pricing",
      heading: "Simple, honest pricing",
      intro: "Our products range from $11 to $60. Every price below comes straight from the current shop.",
      note: "Combo purchases include a free rice soap. Prices are in US dollars; delivery details are confirmed with your order.",
    },
  },
  {
    key: "contact",
    label: "Contact",
    path: "/contact",
    sections: [{ title: "Header", fields: [t("eyebrow", "Eyebrow"), t("heading", "Heading"), ta("intro", "Introduction")] }],
    defaults: {
      eyebrow: "Contact",
      heading: "We would love to hear from you",
      intro: "Questions about a product, an order or a combo? Send us a message and we will reply by email.",
    },
  },
  simple("shop", "Shop", "/shop", "Shop the collection", "Skincare, apparel and combos — thoughtfully selected for your everyday."),
  simple("blogs", "Blogs", "/blogs", "The Sienna Journal", "Inspiration for your everyday glow."),
  simple("testimonials", "Testimonials", "/testimonials", "Kind words", "What customers have shared with us."),
  simple("team", "Our Team", "/our-team", "Our team", "The people behind Sienna Filipina."),
];

export function getPageDef(key: string) {
  return PAGE_DEFS.find((p) => p.key === key);
}
