import Link from 'next/link';
import { DEMO_WORKFLOW_PATH } from '@/lib/demoMode';

const TEAM = [
  { name: 'Jolie Teo', linkedin: 'https://www.linkedin.com/in/jolie-teo/' },
  { name: 'Angelisa Wang', linkedin: 'https://www.linkedin.com/in/angelisa-wang/' },
  { name: 'Elanu Karakus (TA)', linkedin: 'https://www.linkedin.com/in/elanu-karakus/' },
  { name: 'Vanesska Hall', linkedin: 'https://www.linkedin.com/in/vanesska-hall/' },
  { name: 'David Tomz', linkedin: 'https://www.linkedin.com/in/davidtomz/' },
  { name: 'Brandyn Lu', linkedin: 'https://www.linkedin.com/in/brandyn-lu-8a6595301/' },
  { name: 'Anya Pinto', linkedin: 'https://www.linkedin.com/in/anyapinto/' },
];

const TECH = ['Next.js', 'TypeScript', 'Convex', 'Claude API', 'DSPy', 'FastAPI', 'E2B', 'Tailwind CSS'];

const PROTOTYPES = [
  {
    phase: 'Lo-Fi',
    title: 'Filter-based search with block coding',
    description:
      'Our first prototype let users filter analyses by variable, location, and timespan alongside a block-style coding interface. We wanted to preserve user agency over code. In testing, we found the block-coding approach too complex to implement reliably within the project timeline and shifted toward grounding generation in Planet\'s existing Jupyter notebook library.',
  },
  {
    phase: 'Mid-Fi',
    title: 'Conversational chatbot',
    description:
      'The second iteration introduced a chatbot to help users refine queries and generate workflows automatically, with the option to view and modify underlying code. User feedback revealed two problems: participants conflated the tool with general-purpose AI models like ChatGPT, and the open-ended conversation format produced disorganized or inconsistent analysis structure.',
  },
  {
    phase: 'Hi-Fi',
    title: 'Structured questionnaire grounded in Planet notebooks',
    description:
      'The final design replaced the chatbot with a step-by-step intake questionnaire. Static questions collect use case, region, time range, and Planet product; Claude then generates targeted follow-up questions specific to the described analysis. Code generation is grounded in Planet\'s existing Jupyter notebooks to reduce hallucination risk. Users land on a notebook-style page with commented cells, visual outputs, and an inline chat for refinement.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Nav */}
      <header className="flex items-center justify-between h-20 px-8 bg-black">
        <div className="text-white text-xl font-bold">Project Centinela</div>
        <nav className="flex items-center gap-6">
          <Link href="/auth?mode=login" className="text-sm text-white font-semibold hover:opacity-80 transition-opacity">
            Sign In
          </Link>
          <Link href="/auth?mode=signup" className="text-sm text-white font-semibold border border-white rounded-full px-5 py-2 hover:bg-white hover:text-black transition-colors">
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
          Satellite Analysis for Conservationists — No Coding Required
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Planet Centinela gives conservation teams free access to high-quality satellite imagery.
          We built the tools to actually use it.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth?mode=signup"
            className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#009DA5' }}
          >
            Get Started
          </Link>
          <Link
            href={DEMO_WORKFLOW_PATH}
            className="px-8 py-3 rounded-full text-sm font-semibold border border-gray-400 text-white hover:bg-white hover:text-black transition-colors"
          >
            See an Example Workflow
          </Link>
          <a
            href="#the-problem"
            className="px-8 py-3 rounded-full text-sm font-semibold border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white transition-colors"
          >
            Learn More
          </a>
        </div>
        <p className="text-gray-500 text-xs mt-5">
          No account needed to view the example.
        </p>
      </section>

      {/* Context */}
      <section id="the-problem" className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">The Problem We're Solving</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            Planet Centinela, developed by Planet Labs, provides free high-frequency satellite data
            to conservation organizations monitoring 50 of the world's most vulnerable biodiversity
            hotspots. For most teams, that data sits behind complex APIs and documentation written
            for engineers, not the ecologists and field researchers who actually need it.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            Ecologists, field researchers, and conservation managers know exactly what they want
            to learn from the data. They just shouldn't need to become software engineers to get there.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { quote: 'The learning curve for Planet products and workflows remains steep.', org: 'Osa Conservation' },
              { quote: 'We need ongoing training for local GIS teams on API usage and the development of change detection algorithms.', org: 'Upemba National Park' },
              { quote: 'Specific training on this [the API] or the ability to access this information with a UI would have been very beneficial.', org: 'Jane Goodall Institute' },
            ].map(({ quote, org }) => (
              <div key={org} className="flex flex-col justify-between bg-gray-50 rounded-2xl px-5 py-5">
                <p className="text-sm text-gray-600 leading-relaxed italic mb-4">&ldquo;{quote}&rdquo;</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{org}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-3xl mx-auto w-full" />

      {/* Needfinding */}
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Needfinding & Research</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            Our primary target users are conservation teams working within the Project Centinela program.
            To understand their needs, we analyzed annual survey data collected from participating organizations —
            a dataset broad enough to capture how different sites across dozens of countries interact with Planet
            data and what limitations they face.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            We supplemented the survey with individual interviews at several conservation sites, which surfaced
            personal experiences and anecdotes that gave texture to the quantitative findings. We also attended
            a priority-setting call with Planet's newest conservation site, observing the onboarding process
            firsthand to understand the expectations and friction points new users encounter.
          </p>

          <div className="mt-10 bg-gray-50 rounded-2xl px-7 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Core Need</p>
            <p className="text-gray-800 text-base leading-relaxed font-medium">
              "Conservation teams need to turn Planet's satellite data into decisions without investing
              significant time, technical expertise, or infrastructure in data access and integration."
            </p>
          </div>

          <p className="text-gray-600 text-base leading-relaxed mt-6 mb-8">
            A recurring theme across interviews was that many users were unwilling to invest substantial
            time learning the platform, particularly because the work is often tied to temporary or
            time-bounded projects. Planet's existing training and documentation, while thorough, was not
            enough to drive adoption under these constraints. What users needed was a platform that
            lowered the barrier to entry structurally — not more documentation.
          </p>

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">How Might We</p>
          <div className="flex flex-col gap-3">
            {[
              'Help teams access insights from Planet data without any setup, API knowledge, or custom workflows?',
              'Deliver answers instead of just satellite data?',
              "Scale one expert's knowledge across fifty teams?",
            ].map((q, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-sm font-bold mt-0.5 flex-shrink-0" style={{ color: '#009DA5' }}>{i + 1}</span>
                <p className="text-gray-600 text-sm leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-3xl mx-auto w-full" />

      {/* Design Process */}
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Design Process</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-10">
            We iterated through three prototype stages, each informed by feedback from testing and
            conversations with conservation teams.
          </p>
          <div className="flex flex-col gap-6">
            {PROTOTYPES.map(({ phase, title, description }) => (
              <div key={phase} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 pt-1">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded"
                    style={{ backgroundColor: '#009DA520', color: '#009DA5' }}
                  >
                    {phase}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-3xl mx-auto w-full" />

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center">What We Built</h2>
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
              <h3 className="font-semibold text-gray-900">Guided Workflow Setup</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Describe what you want to analyze in plain language. A step-by-step questionnaire
                collects your use case, region, time range, and Planet product, then asks targeted
                follow-up questions specific to your goals.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3 mt-1">
                A team monitoring deforestation in the Congo Basin describes their goal, selects
                their region, and receives follow-up questions about baseline dates and key
                vegetation indicators. No API calls needed.
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
                you left off, and keep a record of every study you've configured, all in one place.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3 mt-1">
                A team running separate studies for forest cover, river encroachment, and seasonal
                flooding keeps each analysis saved under its own name, ready to continue whenever
                they need it.
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
              <h3 className="font-semibold text-gray-900">Runnable Notebooks</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Each workflow produces a notebook-style page with commented code blocks and visual
                outputs you can run directly in the browser. Inspect the underlying code, understand
                each step, and modify it if needed.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3 mt-1">
                When a vegetation index calculation returns unexpected values, the inline comments
                explain what each cell does and why, making it straightforward to find and adjust
                the relevant parameter.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How we built it */}
      <section className="py-20 px-8 bg-black text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-10">How We Built It</h2>

          <div className="flex flex-col gap-10">

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#009DA5' }}>Intake & Question Generation</p>
              <p className="text-gray-400 text-base leading-relaxed">
                The intake flow begins with a fixed set of questions — use case, region, time range, and Planet
                product — collected via a structured form. Once submitted, the inputs are sent to Claude Sonnet
                via the Anthropic API, which generates three to five follow-up questions tailored specifically
                to the described analysis (e.g., asking about cloud cover tolerance for a vegetation index
                workflow, or baseline dates for a change detection study). This two-layer structure keeps
                the interface predictable while still adapting to the specifics of each request.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#009DA5' }}>Agentic Workflow Assembly</p>
              <p className="text-gray-400 text-base leading-relaxed">
                Workflow generation is handled by a Python FastAPI server deployed on Railway. The
                assembly pipeline is built with <span className="text-white font-medium">DSPy</span>, using
                a ReAct agent that orchestrates three stages: planning, retrieval, and code generation.
              </p>
              <p className="text-gray-400 text-base leading-relaxed mt-4">
                The <span className="text-white font-medium">planner</span> takes the intake JSON, runs a
                broad discovery search, and prompts Claude Sonnet to generate an ordered list of workflow
                steps grounded in what the search actually found — not a hardcoded skeleton. Each step
                includes a targeted retrieval query. Steps are then processed in parallel via a thread pool,
                each running notebook search and live docs retrieval concurrently. Claude Haiku handles
                per-step material selection (choosing the most relevant cells and docs for each step) to
                keep latency down on the high-volume selection calls.
              </p>
              <p className="text-gray-400 text-base leading-relaxed mt-4">
                The <span className="text-white font-medium">notebook retrieval</span> system uses a
                multi-pass approach: it ranks Planet's Jupyter notebooks by metadata relevance, searches
                cells within the top-ranked notebooks, scores matches, and expands the query if results
                are weak — up to three passes, with the candidate pool growing each round. This grounds
                code generation in real, working Planet examples rather than synthesized code, which was
                a deliberate choice to reduce hallucination risk in an API-specific domain.
              </p>
              <p className="text-gray-400 text-base leading-relaxed mt-4">
                The system is also product-aware: band availability constraints for PlanetScope, SkySat,
                and Basemap are injected into every planning and selection prompt, preventing the
                generation of steps that require bands the product does not carry (e.g., SWIR-dependent
                indices on PlanetScope).
              </p>
              <p className="text-gray-400 text-base leading-relaxed mt-4">
                The <span className="text-white font-medium">coder</span> takes the enriched plan and
                assembles a final notebook, deduplicating imports, normalizing variable names across
                steps, and injecting AOI, date range, and product placeholders from the intake.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#009DA5' }}>Frontend & Data Layer</p>
              <p className="text-gray-400 text-base leading-relaxed">
                The frontend is built with <span className="text-white font-medium">Next.js</span> and TypeScript,
                deployed on Vercel. Assembly runs as a background task via{' '}
                <span className="text-white font-medium">Vercel's <code className="text-sm">waitUntil</code></span>,
                keeping the HTTP response fast while the pipeline completes asynchronously.
                User accounts, workflow configurations, and follow-up Q&A are stored in{' '}
                <span className="text-white font-medium">Convex</span>, a real-time database that pushes
                updates to the dashboard without polling — so the notebook cells appear as soon as assembly
                writes them. Each notebook cell runs in an isolated Python sandbox via{' '}
                <span className="text-white font-medium">E2B</span>, so users can execute code directly
                in the browser without installing any dependencies locally. Completed notebooks can be
                exported to GitHub Gist and opened in Google Colab with one click.
              </p>
            </div>

          </div>

          <div className="flex flex-wrap gap-3 mt-10">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">The Team</h2>
          <p className="text-gray-500 text-sm mb-10">
            Built by Stanford students in CS + Social Good Studio (CS51/52), working alongside the Project Centinela team at Planet Labs.
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
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create your first satellite analysis workflow in a few minutes.
        </p>
        <Link
          href="/auth?mode=signup"
          className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#009DA5' }}
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center bg-black border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Built in collaboration with the Project Centinela team at Planet Labs · Stanford CS + Social Good Studio
        </p>
      </footer>

    </div>
  );
}
