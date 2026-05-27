import Link from 'next/link';

const TEAM = [
  { name: 'Jolie Teo', linkedin: 'https://www.linkedin.com/in/jolie-teo/' },
  { name: 'Angelisa Wang', linkedin: 'https://www.linkedin.com/in/angelisa-wang/' },
  { name: 'Elanu Karakus', linkedin: 'https://www.linkedin.com/in/elanu-karakus/' },
  { name: 'Vanesska Hall', linkedin: 'https://www.linkedin.com/in/vanesska-hall/' },
  { name: 'David Tomz', linkedin: 'https://www.linkedin.com/in/davidtomz/' },
  { name: 'Brandyn Lu', linkedin: 'https://www.linkedin.com/in/brandyn-lu-8a6595301/' },
  { name: 'Anya Pinto', linkedin: 'https://www.linkedin.com/in/anyapinto/' },
];

const TECH = ['Next.js', 'TypeScript', 'Convex', 'Claude API', 'E2B', 'Tailwind CSS'];

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
      <section className="bg-black text-white py-32 px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#009DA5' }}>
          CS + Social Good Studio · Stanford University
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold max-w-3xl mx-auto leading-tight mb-6">
          Satellite analysis for conservationists — no coding required
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Planet Centinela gives conservation teams free access to high-quality satellite imagery.
          We built the tools to actually use it.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth"
            className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#009DA5' }}
          >
            Get Started
          </Link>
          <a
            href="#the-problem"
            className="px-8 py-3 rounded-full text-sm font-semibold border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Context */}
      <section id="the-problem" className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">The problem we're solving</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            Planet Centinela, developed by Planet Labs, provides free high-frequency satellite data
            to conservation organizations monitoring 50 of the world's most vulnerable biodiversity
            hotspots. For most teams, that data sits behind complex APIs and documentation written
            for engineers — not the ecologists and field researchers who actually need it.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            The people doing this work — ecologists, field researchers, conservation managers — know
            exactly what they need to learn from the data. They just shouldn't need to become software
            engineers to get there.
          </p>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-3xl mx-auto w-full" />

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center">What you can do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#009DA520' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#009DA5' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Guided workflow setup</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Describe what you want to analyze in plain language. A step-by-step questionnaire
                collects your use case, region, time range, and Planet product — then asks targeted
                follow-up questions specific to your goals.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#009DA520' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#009DA5' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Workflow dashboard</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your analyses are saved to a personal dashboard. Name each workflow, pick up where
                you left off, and keep a record of every study you've configured — organized and
                accessible from one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#009DA520' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#009DA5' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Runnable notebooks</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Each workflow produces a notebook-style page with commented code blocks and visual
                outputs you can run directly in the browser. Inspect the underlying code, understand
                each step, and modify it if needed.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How we built it */}
      <section className="py-20 px-8 bg-black text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-5">How we built it</h2>
          <p className="text-gray-400 text-base leading-relaxed">
            The frontend is built with Next.js and TypeScript, styled with Tailwind CSS. User data
            and workflows are stored and synced in real time using Convex. Follow-up questions and
            workflow code are generated using Anthropic's Claude API, which interprets each user's
            use case and produces context-specific prompts and analysis code. Notebook cells are
            executed in isolated sandboxes via E2B, so code runs directly in the browser without
            any local setup required.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {TECH.map((t) => (
              <span
                key={t}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-700 text-gray-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">The team</h2>
          <p className="text-gray-500 text-sm mb-10">
            Built by Stanford students in CS + Social Good Studio (CS51/52), in partnership with Planet Labs.
          </p>
          <div className="flex flex-wrap gap-3">
            {TEAM.map(({ name, linkedin }) => (
              <a
                key={name}
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 border border-gray-200 rounded-full hover:border-teal-400 hover:bg-teal-50 transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-teal-600 transition-colors">
                    {name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800">{name}</span>
                <svg className="w-3 h-3 text-gray-300 group-hover:text-teal-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 bg-black text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create your first satellite analysis workflow in a few minutes.
        </p>
        <Link
          href="/auth"
          className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#009DA5' }}
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center bg-black border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Built in partnership with Planet Labs · Stanford CS + Social Good Studio
        </p>
      </footer>

    </div>
  );
}
