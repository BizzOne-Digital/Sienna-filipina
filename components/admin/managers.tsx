"use client";

import { Badge, ResourceManager, Thumb, money } from "./ResourceManager";

const seo = {
  title: "Search engine (SEO)",
  fields: [
    { name: "seoTitle", label: "SEO title", type: "text" as const, maxLength: 120, help: "Leave blank to use the name." },
    { name: "seoDescription", label: "SEO description", type: "textarea" as const, rows: 2, maxLength: 300 },
  ],
};

export function ProductsManager({ categories }: { categories: { _id: string; name: string }[] }) {
  const catOptions = categories.map((c) => ({ value: c._id, label: c.name }));
  return (
    <ResourceManager
      resource="products"
      singular="Product"
      emptyText="No products yet. Create your first product."
      filters={[
        { name: "published", label: "Status", options: [{ value: "true", label: "Published" }, { value: "false", label: "Draft" }] },
        { name: "category", label: "Category", options: catOptions },
      ]}
      defaults={{
        name: "", slug: "", shortDescription: "", description: "", priceCents: "", compareAtCents: "", priceLabel: "",
        images: [], category: "", stock: 0, variants: [], badge: "", comboOffer: "", featured: false, published: false,
        sortOrder: 0, seoTitle: "", seoDescription: "", isDemo: false,
      }}
      toForm={(p) => ({
        ...p,
        category: p.category?._id ?? p.category ?? "",
        priceCents: p.priceCents != null ? (p.priceCents / 100).toFixed(2) : "",
        compareAtCents: p.compareAtCents != null ? (p.compareAtCents / 100).toFixed(2) : "",
        variants: (p.variants ?? []).map((v: any) => ({ ...v, price: v.priceCents != null ? (v.priceCents / 100).toFixed(2) : "" })),
      })}
      columns={[
        { label: "", render: (p) => <Thumb src={p.images?.[0]} />, className: "w-16" },
        {
          label: "Product",
          render: (p) => (
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-cocoa">{p.category?.name ?? "No category"}{p.isDemo ? " · Demo content" : ""}</p>
            </div>
          ),
        },
        { label: "Price", render: (p) => `${p.priceLabel ? `${p.priceLabel} ` : ""}${money(p.priceCents)}` },
        {
          label: "Stock",
          render: (p) =>
            p.variants?.length ? `${p.variants.reduce((s: number, v: any) => s + v.stock, 0)} (${p.variants.length} options)` : p.stock,
        },
        { label: "Status", render: (p) => <div className="flex flex-wrap gap-1"><Badge on={p.published} yes="Published" no="Draft" />{p.featured && <Badge on yes="Featured" no="" />}</div> },
      ]}
      groups={[
        {
          title: "Basics",
          fields: [
            { name: "name", label: "Name", type: "text", required: true, maxLength: 140 },
            { name: "slug", label: "URL slug", type: "slug", slugFrom: "name" },
            { name: "category", label: "Category", type: "select", options: catOptions },
            { name: "badge", label: "Badge", type: "text", maxLength: 40, help: "Short label on the card, e.g. “Free rice soap”." },
            { name: "shortDescription", label: "Short description", type: "textarea", rows: 2, maxLength: 300 },
            { name: "description", label: "Full description", type: "textarea", rows: 8, help: "Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a bullet." },
          ],
        },
        {
          title: "Pricing & stock",
          fields: [
            { name: "priceCents", label: "Price ($)", type: "money" },
            { name: "priceLabel", label: "Price prefix", type: "text", maxLength: 20, help: "Optional, e.g. “From” or “Up to”." },
            { name: "compareAtCents", label: "Compare-at price ($)", type: "money", optional: true, help: "Optional original price." },
            { name: "stock", label: "Stock (when no options)", type: "number", min: 0 },
            { name: "variants", label: "Options / variants", type: "variants", help: "Add options such as sizes. When options exist, stock is tracked per option." },
          ],
        },
        { title: "Images", fields: [{ name: "images", label: "Product images", type: "images", folder: "products", max: 8, help: "The first image is used on cards." }] },
        {
          title: "Offer & visibility",
          fields: [
            { name: "comboOffer", label: "Combo offer text", type: "textarea", rows: 2, maxLength: 300, help: "Shown on the product page. Leave blank to use the site-wide combo text for combo products." },
            { name: "published", label: "Published", type: "checkbox", help: "Visible in the shop." },
            { name: "featured", label: "Featured on homepage", type: "checkbox" },
            { name: "sortOrder", label: "Sort order", type: "number", help: "Lower numbers appear first." },
            { name: "isDemo", label: "Demo content", type: "checkbox", help: "Clear once photos, prices and stock are confirmed." },
          ],
        },
        seo,
      ]}
    />
  );
}

export function CategoriesManager() {
  return (
    <ResourceManager
      resource="categories"
      singular="Category"
      emptyText="No categories yet."
      defaults={{ name: "", slug: "", description: "", image: "", sortOrder: 0, isCombo: false, isDemo: false }}
      columns={[
        { label: "", render: (c) => <Thumb src={c.image} />, className: "w-16" },
        { label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
        { label: "Slug", render: (c) => <code className="text-xs">{c.slug}</code> },
        { label: "Combo", render: (c) => <Badge on={c.isCombo} yes="Combo" no="—" /> },
        { label: "Order", render: (c) => c.sortOrder },
      ]}
      groups={[
        {
          title: "Category",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "slug", label: "URL slug", type: "slug", slugFrom: "name", help: "Used in links, e.g. /shop?category=skincare. Homepage buttons link to “skincare”, “apparel” and “combos”." },
            { name: "description", label: "Description", type: "textarea", rows: 2 },
            { name: "sortOrder", label: "Sort order", type: "number" },
            { name: "isCombo", label: "Combo category", type: "checkbox", help: "Products here receive the free rice soap at checkout." },
            { name: "image", label: "Image", type: "image", folder: "misc" },
          ],
        },
      ]}
    />
  );
}

export function BlogsManager() {
  return (
    <ResourceManager
      resource="blogs"
      singular="Article"
      emptyText="No articles yet."
      filters={[{ name: "published", label: "Status", options: [{ value: "true", label: "Published" }, { value: "false", label: "Draft" }] }]}
      defaults={{ title: "", slug: "", category: "Skincare", excerpt: "", content: "", coverImage: "", published: false, seoTitle: "", seoDescription: "", isDemo: false }}
      columns={[
        { label: "", render: (b) => <Thumb src={b.coverImage} />, className: "w-16" },
        { label: "Title", render: (b) => <div><p className="font-medium">{b.title}</p><p className="text-xs text-cocoa">{b.category}{b.isDemo ? " · Demo content" : ""}</p></div> },
        { label: "Status", render: (b) => <Badge on={b.published} yes="Published" no="Draft" /> },
        { label: "Published", render: (b) => (b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "—") },
      ]}
      groups={[
        {
          title: "Article",
          fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "slug", label: "URL slug", type: "slug", slugFrom: "title" },
            { name: "category", label: "Category", type: "text", help: "e.g. Skincare, Lifestyle" },
            { name: "published", label: "Published", type: "checkbox" },
            { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, maxLength: 400 },
            { name: "content", label: "Content", type: "textarea", rows: 14, help: "Blank line = new paragraph. “## ” heading, “- ” bullet. Avoid medical or guaranteed-result claims." },
            { name: "coverImage", label: "Cover image", type: "image", folder: "pages" },
            { name: "isDemo", label: "Demo content", type: "checkbox" },
          ],
        },
        seo,
      ]}
    />
  );
}

export function TestimonialsManager() {
  return (
    <ResourceManager
      resource="testimonials"
      singular="Testimonial"
      emptyText="No testimonials yet. Add genuine customer feedback here once you receive it."
      filters={[{ name: "approved", label: "Status", options: [{ value: "true", label: "Approved" }, { value: "false", label: "Awaiting approval" }] }]}
      defaults={{ name: "", location: "", quote: "", rating: "", photo: "", approved: false, sortOrder: 0 }}
      columns={[
        { label: "Customer", render: (t) => <div><p className="font-medium">{t.name}</p><p className="text-xs text-cocoa">{t.location}</p></div> },
        { label: "Quote", render: (t) => <p className="line-clamp-2 max-w-md text-cocoa">{t.quote}</p> },
        { label: "Rating", render: (t) => (t.rating ? `${t.rating}/5` : "—") },
        { label: "Status", render: (t) => <Badge on={t.approved} yes="Approved" no="Pending" /> },
      ]}
      groups={[
        {
          title: "Testimonial",
          fields: [
            { name: "name", label: "Customer name", type: "text", required: true, help: "Use only with the customer's permission." },
            { name: "location", label: "Location (optional)", type: "text" },
            { name: "quote", label: "Quote", type: "textarea", required: true, rows: 4 },
            { name: "rating", label: "Rating 1–5 (optional)", type: "number", min: 1, max: 5, optional: true, help: "Only enter a rating the customer actually gave." },
            { name: "approved", label: "Approved for website", type: "checkbox" },
            { name: "sortOrder", label: "Sort order", type: "number" },
            { name: "photo", label: "Photo (optional)", type: "image", folder: "misc" },
          ],
        },
      ]}
    />
  );
}

export function TeamManager() {
  return (
    <ResourceManager
      resource="team"
      singular="Team member"
      emptyText="No team members yet. The public Our Team page shows a friendly placeholder until you add someone."
      defaults={{ name: "", role: "", bio: "", photo: "", visible: true, sortOrder: 0 }}
      columns={[
        { label: "", render: (m) => <Thumb src={m.photo} />, className: "w-16" },
        { label: "Name", render: (m) => <div><p className="font-medium">{m.name}</p><p className="text-xs text-cocoa">{m.role}</p></div> },
        { label: "Visible", render: (m) => <Badge on={m.visible} yes="Visible" no="Hidden" /> },
        { label: "Order", render: (m) => m.sortOrder },
      ]}
      groups={[
        {
          title: "Team member",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "role", label: "Role", type: "text" },
            { name: "bio", label: "Short bio", type: "textarea", rows: 4 },
            { name: "visible", label: "Visible on website", type: "checkbox" },
            { name: "sortOrder", label: "Sort order", type: "number" },
            { name: "photo", label: "Photo", type: "image", folder: "misc" },
          ],
        },
      ]}
    />
  );
}
