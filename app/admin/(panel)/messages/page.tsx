import { Suspense } from "react";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <>
      <AdminPageTitle title="Messages" description="Contact form submissions." />
      <Suspense>
        <MessagesManager />
      </Suspense>
    </>
  );
}
