import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Bookme</h1>
        <p className="text-slate-600 mb-8">
          Multi-tenant restaurant table booking platform.
          Sell as one-off install or SaaS.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-6 py-2.5 rounded-lg transition"
          >
            Staff Login
          </Link>
          <Link
            href="/book"
            className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-6 py-2.5 rounded-lg transition"
          >
            Make a Reservation
          </Link>
        </div>
      </div>
    </div>
  );
}
