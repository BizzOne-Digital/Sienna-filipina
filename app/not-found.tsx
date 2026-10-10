import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-ivory px-4 text-center">
      <div>
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-3 text-5xl text-espresso sm:text-6xl">This page has wandered off.</h1>
        <p className="mt-4 text-cocoa">The link may be outdated, or the page may have moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/shop" className="btn btn-outline">Visit the shop</Link>
        </div>
      </div>
    </main>
  );
}
