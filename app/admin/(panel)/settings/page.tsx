import { SettingsForm } from "@/components/admin/SettingsForm";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <AdminPageTitle title="Settings" description="Logo, contact details, hours, social links, announcement bar and SEO." />
      <SettingsForm />
    </>
  );
}
