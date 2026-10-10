import { Suspense } from "react";
import { ProductsManager } from "@/components/admin/managers";
import { AdminPageTitle } from "@/components/admin/Sidebar";
import { connectDB } from "@/lib/db/connect";
import { Category } from "@/models";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  await connectDB();
  const categories = (await Category.find().sort({ sortOrder: 1, name: 1 }).select("name").lean()).map((c) => ({
    _id: String(c._id),
    name: c.name,
  }));
  return (
    <>
      <AdminPageTitle title="Products" description="Prices, images, stock, options and visibility." />
      <Suspense>
        <ProductsManager categories={categories} />
      </Suspense>
    </>
  );
}
