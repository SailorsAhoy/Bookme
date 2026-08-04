import Link from "next/link";

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">You&apos;re all set!</h1>
        <p className="text-slate-600 mb-6">
          Your restaurant account is being provisioned. You will receive an email with your
          login details shortly (check spam too).
        </p>
        <p className="text-sm text-slate-500 mb-8">
          After logging in you can set your logo, colors, sections and tables, then share
          your public booking page with guests.
        </p>
        <Link
          href="/login"
          className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-medium px-6 py-2.5 rounded-lg transition"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
