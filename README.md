# Sienna Filipina — Skincare & Apparel

Online store and admin panel for Sienna Filipina, built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4, and MongoDB/Mongoose.

- **Storefront:** `/`, `/shop`, `/shop/[slug]`, `/pricing`, `/services`, `/about-us`, `/our-team`, `/testimonials`, `/blogs`, `/blogs/[slug]`, `/contact`, `/cart`, `/checkout`, `/order-confirmation/[id]`
- **Admin:** `/admin/login`, `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/pages`, `/admin/blogs`, `/admin/testimonials`, `/admin/team`, `/admin/gallery`, `/admin/messages`, `/admin/settings`
- **Images:** every uploaded image is stored in MongoDB. Nothing is written to disk.

---

## 1. Run locally

Requirements: Node.js 20+ and a MongoDB database (MongoDB Atlas free tier is fine).

```bash
npm install
cp .env.example .env.local      # then fill in the values (see section 2)
npm run create-admin            # creates the first admin (see section 3)
npm run seed                    # optional demo content (see section 4)
npm run dev                     # http://localhost:3000
```

Checks:

```bash
npm run typecheck
npm run build && npm start
```

## 2. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string, including the database name. |
| `SESSION_SECRET` | Yes | Random string, 32+ characters. Used to hash session and order-access tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL with no trailing slash, e.g. `https://siennafilipina.com`. Used for the sitemap, metadata and the Origin/CSRF check. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Only for `create-admin` | Initial admin account. Remove the password once the account exists. |
| `NEXT_PUBLIC_UNOPTIMIZED_UPLOADS` | No | Set to `true` only if your host cannot optimize images served from `/api/uploads` (see section 6). |

Never commit `.env` or `.env.local`; both are already in `.gitignore`.

### Connecting MongoDB Atlas

1. Create a cluster, then a database user under **Database Access**.
2. Under **Network Access**, allow your IP for local work. Vercel uses dynamic IPs, so allow `0.0.0.0/0` (or use Atlas's Vercel integration).
3. Copy the connection string from **Connect → Drivers** and add a database name, e.g. `.../sienna-filipina?retryWrites=true&w=majority`.

## 3. Create the first admin

There is no public sign-up endpoint. Admins are created from a trusted machine:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-unique-password' ADMIN_NAME='Your Name' npm run create-admin
```

(PowerShell: `$env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; npm run create-admin`)

- The password must be at least 12 characters and is stored as a bcrypt hash.
- To reset a password, run the same command with `-- --reset-password`. This also signs out existing sessions.

**How security works:**

- Sessions are random tokens stored hashed in MongoDB, in an HttpOnly, SameSite=Lax cookie (`__Host-` prefixed and Secure in production). Sessions last 12 hours.
- Every admin page and every admin API route checks the session against the database.
- Every cookie-authenticated mutation must pass an Origin check.
- Login attempts are rate-limited per IP and per email. The counters live in MongoDB, so they hold across serverless instances.

## 4. Demo content (seed)

`npm run seed` is **idempotent**: it only inserts records that don't exist yet (matched by slug or key) and never overwrites anything an admin has edited.

It creates:

- **Categories:** Skincare, Apparel, Combos. Combos is the combo category, which triggers the free rice soap.
- **Six demo products:** Rice Soap ($11), Daily Skincare Set (from $35), Skincare Combo (up to $60), Facial Serum, Everyday Knit Top, Classic White Shirt.
- **Two demo journal articles.**
- **Site settings:** the supplied business email and phone. The phone is hidden by default; business hours and social links stay empty until the admin adds them.

**Important:**

- Demo records carry an internal `isDemo` flag, and the dashboard shows a reminder while any remain. The products are **not verified inventory**. Their prices, stock, descriptions and photos are placeholders: confirm or replace each one, then untick **Demo content**.
- The default photos are AI-generated Sienna Filipina theme concepts, not verified photographs of actual inventory. Replace them through the admin image fields. Optimized files ship in public/images/sienna/; source PNGs and the contact sheet are in output/imagegen/.
- **No testimonials, ratings or team members are seeded.** Those pages show honest empty states until real content is entered.
- The checkout gift is the published product with the slug `rice-soap`. Keep that slug if you rename the product.
- Storefront reads are cached and refreshed automatically when you save in the admin. If you change the database directly (for example by re-running the seed against a live site), redeploy or restart so the cache refreshes.

## 5. Deploy to Vercel

1. Push the project to a Git repository and import it into Vercel.
2. Add `MONGODB_URI`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` under **Project → Settings → Environment Variables** (Production and Preview).
3. Deploy. The build does not need database access.
4. From your machine, run `create-admin` (and `seed` if wanted) with `MONGODB_URI` pointing at the production database.
5. Sign in at `https://your-domain/admin/login`.

## 6. Image uploads (MongoDB storage)

All admin image fields use one component, `components/admin/AdminImageField.tsx`. It picks the upload flow automatically:

| File size | Flow | Endpoints |
|---|---|---|
| Up to 3.5 MB | Direct multipart upload | `POST /api/upload` (fields `file`, `folder`) |
| 3.5–8 MB | Chunked upload, 1 MB chunks | `POST /api/upload/chunked` → `PUT /api/upload/chunked/{id}/{index}` → `POST /api/upload/chunked/{id}/complete` (cancel with `DELETE /api/upload/chunked/{id}`) |
| Over 8 MB | Rejected in the browser and on the server | — |

**Why two flows:** Vercel Functions accept about 4.5 MB request bodies, so an 8 MB multipart upload would fail. Chunks are stored temporarily in MongoDB (`UploadSession` / `UploadChunk`, with TTL expiry after 30 minutes). Each session is bound to the signed-in admin, limited to 3 open sessions per admin, and validated for size, chunk index and chunk count. Retrying a chunk is idempotent. At completion the chunks are reassembled in memory, the image signature is re-checked, and a single `StoredUpload` document is saved.

**Validation:**

- Folders are restricted to `products`, `gallery`, `pages` and `misc`.
- File types are restricted to PNG, JPEG, WebP and GIF. The real format is detected from the file's bytes, not the browser's MIME type.
- Empty files are rejected.
- Filenames are generated as `{timestamp}-{16 random hex}.{ext}` using crypto-secure randomness.

**Delivery:** `GET /api/uploads/{folder}/{filename}` is public and read-only.

- It validates the folder and filename (rejecting `..`, slashes, backslashes and null bytes) and returns 404 for anything else.
- It sends the correct `Content-Type` and `Content-Length`, `Cache-Control: public, max-age=31536000, immutable`, and `X-Content-Type-Options: nosniff`.
- It streams the bytes through a pull-based `ReadableStream` in 64 KB slices, so a slow client applies backpressure.
- Visitors normally receive resized versions from Next.js image optimization, not the original file.

> **Verify on your host:** Vercel limits function *response* bodies too. After deploying, upload a ~7 MB image and open its `/api/uploads/...` URL directly. Then check the page that uses it. If the direct URL fails on your plan, either keep originals under ~4 MB (the image field still accepts up to 8 MB), or set `NEXT_PUBLIC_UNOPTIMIZED_UPLOADS=true` only if the optimizer is the part that fails. The storage provider does not change.

**Content stores URLs only.** Products, pages, blogs, settings and so on store strings such as `/api/uploads/products/1712345678901-ab12cd34ef56ab78.webp`, never base64 or binaries. Each content document also keeps an indexed `imageRefs` list, used for reference checks.

**Safe replacement and removal:**

1. The new image is uploaded.
2. The content document is saved with the new URL.
3. Only after the save succeeds is the old upload deleted, and only if no other document still references it. Gallery uploads are kept until deleted from **Admin → Gallery**, which refuses to delete images still in use.

Images uploaded and then abandoned (the form was cancelled, or a second image replaced the first before saving) are discarded automatically. Anything left over shows as **Unused** in the Gallery.

**Legacy and missing images:** old `/uploads/...` paths, empty values, removed uploads and failed loads all show `/public/placeholder.svg`. The fallback runs once only, so it cannot loop.

### Testing that uploads survive a redeploy

1. Upload an image in Admin → Products and save.
2. Note its `/api/uploads/...` URL in Admin → Gallery.
3. Trigger a fresh deployment (Vercel → Redeploy without build cache).
4. Open the URL and the product page again. The image still loads, because it lives in MongoDB, not in the deployment.

## 7. Checkout and payments

Online payment is **not** implemented. The checkout is a clearly labelled **manual-payment order**:

- Prices, availability, variants, combo gifts and totals are recalculated on the server.
- The order is rejected if the visitor's displayed total no longer matches.
- Stock is reserved atomically, and rolled back if anything fails.
- The order is saved as `pending_payment` / `unpaid`. The confirmation page states that **no payment has been taken**.
- The confirmation page requires a secret token issued at checkout, so other visitors cannot open orders by guessing IDs.
- The admin confirms by email, marks the payment **Paid** only after receiving it, then moves the order through Processing → Shipped → Completed.

**Adding Stripe later:** create Checkout Sessions on the server from the same `quoteCart()` result, use test keys until production credentials exist, and mark orders paid **only** from a verified `checkout.session.completed` webhook (`stripe.webhooks.constructEvent` with the webhook secret). Never mark an order paid from the browser redirect.

## 8. Project structure

```
app/(store)/…           public pages (one folder per route)
app/admin/login         sign-in page
app/admin/(panel)/…     protected admin pages
app/api/…               upload, uploads, auth, contact, cart, orders, admin APIs
components/storefront   header, footer, cards, cart, checkout
components/admin        image field, resource manager, editors
lib/                    db, auth, uploads, content queries, pricing
models/                 Mongoose models
scripts/                create-admin, seed
```

## 9. Content notes

- Business hours, social links and the public phone number stay hidden until set in **Admin → Settings**.
- Social links must be real `https://facebook.com/...` or `https://instagram.com/...` URLs.
- Blog guidance: avoid medical claims and guaranteed results.
- Testimonials appear only after approval. Ratings appear only when entered.

## Generated theme images

14 matching hero, collection, product, story and journal photos are bundled in `public/images/sienna/` as WebP files. These are build-time theme assets, not admin uploads. Admin uploads continue to be persisted exclusively in MongoDB.

Run `npm run images:apply` to migrate only the original demo Unsplash image references in an existing database. Custom URLs and uploaded images are preserved. The storefront also resolves original demo URLs to the new assets if migration has not run. Restart the development server after the migration; for a deployed site, redeploy to include the assets and clear prior content caches.

Original PNGs are in `output/imagegen/originals/`, and `output/imagegen/contact-sheet.jpg` previews all assets in manifest order.
