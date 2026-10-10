import { Suspense } from "react";
import { BlogsManager } from "@/components/admin/managers";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Blogs" };

export default function BlogsAdminPage() {
  return (
    <>
      <AdminPageTitle title="Blogs" description="Journal articles, publication status and SEO." />
      <Suspense>
        <BlogsManager />
      </Suspense>
    </>
  );
}
