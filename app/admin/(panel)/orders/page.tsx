import { Suspense } from "react";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { AdminPageTitle } from "@/components/admin/Sidebar";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <AdminPageTitle title="Orders" description="Manual-payment orders placed through checkout." />
      <Suspense>
        <OrdersManager />
      </Suspense>
    </>
  );
}
