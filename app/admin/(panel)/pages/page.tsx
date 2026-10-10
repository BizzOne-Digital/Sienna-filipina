import { PagesEditor } from "@/components/admin/PagesEditor";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Pages" };

export default function PagesAdminPage() {
  return (
    <>
      <AdminPageTitle title="Pages" description="Homepage sections, page copy and images. Saved changes appear on the website immediately." />
      <PagesEditor />
    </>
  );
}
