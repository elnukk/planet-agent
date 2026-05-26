import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Nav */}
      <header className="flex items-center justify-between h-20 px-8 bg-black">
        <div className="text-white text-xl font-bold">Project Centinela</div>
        <nav className="flex items-center gap-6">
          <Link href="/auth" className="text-sm text-white font-semibold hover:opacity-80 transition-opacity">
            Sign In
          </Link>
          <Link href="/auth" className="text-sm text-white font-semibold border border-white rounded-full px-5 py-2 hover:bg-white hover:text-black transition-colors">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 bg-gray-50 flex-1">
        <div className="h-12 w-96 bg-gray-200 rounded mb-4" />
        <div className="h-6 w-72 bg-gray-100 rounded mb-8" />
        <div className="flex gap-4">
          <div className="h-12 w-36 bg-gray-200 rounded-full" />
          <div className="h-12 w-36 bg-gray-100 rounded-full" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8 max-w-5xl mx-auto w-full">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <div className="h-10 w-10 bg-gray-200 rounded-xl" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 rounded" />
                <div className="h-3 w-3/5 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 bg-black text-white text-center">
        <div className="h-8 w-72 bg-gray-700 rounded mx-auto mb-4" />
        <div className="h-5 w-56 bg-gray-700 rounded mx-auto mb-8" />
        <div className="h-12 w-40 bg-gray-600 rounded-full mx-auto" />
      </section>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center bg-black border-t border-gray-800">
        <div className="h-4 w-48 bg-gray-700 rounded" />
      </footer>

    </div>
  );
}
