import Link from "next/link";
import { AlertTriangle, Mail, Package, Receipt, Newspaper, MessageSquareQuote, Images } from "lucide-react";
import { AdminPageTitle } from "@/components/admin/Sidebar";
import { connectDB } from "@/lib/db/connect";
import { formatDate, formatMoney } from "@/lib/format";
import { BlogPost, ContactMessage, Order, Product, StoredUpload, Testimonial } from "@/models";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await connectDB();
  const [products, published, lowStock, demoProducts, pendingOrders, orders, newMessages, posts, pendingTestimonials, uploads, recentOrders, revenue] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ published: true }),
      Product.find({ published: true, variants: { $size: 0 }, stock: { $lte: 3 } }).select("name slug stock").limit(8).lean(),
      Product.countDocuments({ isDemo: true }),
      Order.countDocuments({ status: "pending_payment" }),
      Order.countDocuments(),
      ContactMessage.countDocuments({ status: "new" }),
      BlogPost.countDocuments({ published: true }),
      Testimonial.countDocuments({ approved: false }),
      StoredUpload.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(6).select("orderNumber customer.name totalCents status createdAt").lean(),
      Order.aggregate<{ total: number }>([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalCents" } } }]),
    ]);

  const stats = [
    { label: "Orders awaiting payment", value: pendingOrders, href: "/admin/orders?status=pending_payment", icon: Receipt, warn: pendingOrders > 0 },
    { label: "New messages", value: newMessages, href: "/admin/messages?status=new", icon: Mail, warn: newMessages > 0 },
    { label: "Published products", value: `${published} / ${products}`, href: "/admin/products", icon: Package },
    { label: "Total orders", value: orders, href: "/admin/orders", icon: Receipt },
    { label: "Paid revenue", value: formatMoney(revenue[0]?.total ?? 0), href: "/admin/orders?status=paid", icon: Receipt },
    { label: "Published articles", value: posts, href: "/admin/blogs", icon: Newspaper },
    { label: "Testimonials to review", value: pendingTestimonials, href: "/admin/testimonials?approved=false", icon: MessageSquareQuote, warn: pendingTestimonials > 0 },
    { label: "Uploaded images", value: uploads, href: "/admin/gallery", icon: Images },
  ];

  return (
    <>
      <AdminPageTitle title="Dashboard" description="What needs attention today." />

      {demoProducts > 0 && (
        <div className="mb-6 flex gap-3 border border-[#e5c7a8] bg-[#fdf3e7] p-4 text-sm text-[#7a4a1d]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            {demoProducts} demo product{demoProducts === 1 ? "" : "s"} from the initial setup {demoProducts === 1 ? "is" : "are"} still in the shop. Replace the stock
            photos, confirm prices and stock, then clear the &ldquo;Demo content&rdquo; flag in{" "}
            <Link href="/admin/products" className="underline">Products</Link>.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`block border bg-[#fffdfa] p-5 transition hover:border-copper ${s.warn ? "border-rose" : "border-line"}`}>
            <s.icon className={`h-5 w-5 ${s.warn ? "text-copper" : "text-cocoa"}`} aria-hidden />
            <p className="mt-3 font-serif text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-cocoa">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-[#fffdfa] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-copper">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-cocoa">No orders yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Recent orders</caption>
              <thead className="text-left text-xs text-cocoa">
                <tr><th className="py-2 font-medium">Order</th><th className="font-medium">Customer</th><th className="font-medium">Total</th><th className="font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={String(o._id)}>
                    <td className="py-2.5"><Link href={`/admin/orders?q=${o.orderNumber}`} className="text-copper">{o.orderNumber}</Link><div className="text-xs text-cocoa">{formatDate(o.createdAt)}</div></td>
                    <td>{o.customer?.name}</td>
                    <td className="tabular-nums">{formatMoney(o.totalCents)}</td>
                    <td className="text-xs">{o.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="border border-line bg-[#fffdfa] p-5">
          <h2 className="text-2xl">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-cocoa">No published products are running low.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {lowStock.map((p) => (
                <li key={String(p._id)} className="flex justify-between py-2">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? "font-medium text-[#a3392b]" : "text-cocoa"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
