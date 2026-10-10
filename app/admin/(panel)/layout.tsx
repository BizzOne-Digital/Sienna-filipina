import { AdminShell } from "@/components/admin/Sidebar";
import { requireAdminPage } from "@/lib/auth/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
