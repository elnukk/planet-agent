import { NextRequest, NextResponse } from 'next/server';

const STOP_WORDS = new Set([
  // articles, conjunctions, prepositions
  'the','a','an','and','or','for','in','of','to','with','by','from',
  'is','are','was','were','be','been','at','on','as','it','its','that',
  'this','these','those','can','will','would','could','should','may',
  'use','using','based','via','per','into','over','under','between',
  // intent/desire verbs — describe what the user wants, not the subject
  'want','need','like','would','trying','looking','hope','plan','wish',
  'help','try','get','make','find','see','know','think','show','tell',
  // action/methodology verbs — describe the method, not the subject
  'detect','identify','locate','measure','analyze','analyse','assess',
  'compute','calculate','generate','create','build','develop','apply',
  'perform','run','execute','process','extract','derive','estimate',
  'predict','classify','map','track','monitor','survey',
  // methodology nouns
  'detection','monitoring','analysis','assessment','tracking','mapping',
  'imagery','satellite','remote','sensing','workflow','data','change',
  'pattern','distribution','prediction','temporal','spatial','model',
  'study','project','system','impact','risk','index','driven',
  'health','management','evaluation','estimation','classification',
  // qualifiers / legal terms that don't help find images
  'illegal','legal','unauthorized','suspected','potential','possible',
]);

function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 2);
}

async function wikiImagesForQuery(query: string, limit: number): Promise<string[]> {
  const urls: string[] = [];

  // Search Wikipedia for articles matching the query
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json&origin=*`,
    { headers: { 'User-Agent': 'PlanetCentinela/1.0' } },
  );
  const searchData = await searchRes.json();
  const results: Array<{ title: string }> = searchData.query?.search ?? [];

  // Also prepend the direct title lookup so the most-relevant article is first
  const titles = [query, ...results.map((r) => r.title)];
  const unique = [...new Set(titles)].slice(0, 8);

  // Batch fetch pageimages for all titles at once
  const batchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${unique.map(encodeURIComponent).join('|')}&prop=pageimages&format=json&pithumbsize=800&origin=*`,
    { headers: { 'User-Agent': 'PlanetCentinela/1.0' } },
  );
  const batchData = await batchRes.json();
  const pages = Object.values(batchData.query?.pages ?? {}) as Array<{
    title: string;
    thumbnail?: { source: string };
  }>;

  // Sort to match the original title order so most-relevant comes first
  const titleIndex = (t: string) => unique.findIndex((u) => u.toLowerCase() === t.toLowerCase());
  pages
    .filter((p) => p.thumbnail?.source)
    .sort((a, b) => titleIndex(a.title) - titleIndex(b.title))
    .forEach((p) => { if (p.thumbnail?.source) urls.push(p.thumbnail.source); });

  return urls.slice(0, limit);
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? '';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '5', 10), 10);
  const keywords = extractKeywords(name);

  if (keywords.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  try {
    const queries = keywords.length > 1
      ? [keywords.join(' '), keywords[0]]
      : [keywords[0]];

    const seen = new Set<string>();
    const all: string[] = [];

    for (const query of queries) {
      const batch = await wikiImagesForQuery(query, limit);
      for (const url of batch) {
        if (!seen.has(url)) { seen.add(url); all.push(url); }
        if (all.length >= limit) break;
      }
      if (all.length >= limit) break;
    }

    return NextResponse.json({ urls: all });
  } catch {
    return NextResponse.json({ urls: [] });
  }
}
