import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="max-w-md text-center">
        <span className="text-sm font-semibold tracking-tight">
          Disclosed<span className="text-blue-800">.</span>
        </span>
        <p className="mt-4 text-5xl font-semibold tracking-tight text-slate-300">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The link may be out of date or the page may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
