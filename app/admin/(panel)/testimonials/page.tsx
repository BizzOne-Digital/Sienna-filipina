import { Suspense } from "react";
import { TestimonialsManager } from "@/components/admin/managers";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Testimonials" };

export default function TestimonialsAdminPage() {
  return (
    <>
      <AdminPageTitle title="Testimonials" description="Only approved testimonials appear on the website." />
      <Suspense>
        <TestimonialsManager />
      </Suspense>
    </>
  );
}
