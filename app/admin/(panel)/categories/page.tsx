import { Suspense } from "react";
import { CategoriesManager } from "@/components/admin/managers";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <AdminPageTitle title="Categories" description="Shop sections such as Skincare, Apparel and Combos." />
      <Suspense>
        <CategoriesManager />
      </Suspense>
    </>
  );
}
