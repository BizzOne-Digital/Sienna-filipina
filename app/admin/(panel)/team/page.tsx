import { Suspense } from "react";
import { TeamManager } from "@/components/admin/managers";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Team" };

export default function TeamAdminPage() {
  return (
    <>
      <AdminPageTitle title="Team" description="People shown on the Our Team page." />
      <Suspense>
        <TeamManager />
      </Suspense>
    </>
  );
}
