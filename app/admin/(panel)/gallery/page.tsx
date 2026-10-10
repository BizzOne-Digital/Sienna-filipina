import { GalleryManager } from "@/components/admin/GalleryManager";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <>
      <AdminPageTitle title="Gallery" description="All uploaded images and their usage." />
      <GalleryManager />
    </>
  );
}
