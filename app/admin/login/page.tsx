import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdmin().catch(() => null)) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-ivory to-blush-soft px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mx-auto h-28 w-fit">
          <Image src="/brand/logo-transparent.png" alt="Sienna Filipina" width={175} height={130} className="h-full w-auto" priority />
        </div>
        <div className="mt-6 border border-line bg-[#fffdfa] p-7 shadow-[0_20px_50px_-35px_rgba(73,35,23,0.6)]">
          <h1 className="text-center text-3xl">Admin sign in</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
