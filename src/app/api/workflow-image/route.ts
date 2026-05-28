import { NextRequest, NextResponse } from 'next/server';

const STOP_WORDS = new Set([
  // articles, conjunctions, prepositions
  'the','a','an','and','or','for','in','of','to','with','by','from',
  'is','are','was','were','be','been','at','on','as','it','its','that',
  'this','these','those','can','will','would','could','should','may',
  'use','using','based','via','per','into','over','under','between',
  // intent verbs
  'want','need','like','trying','looking','hope','plan','wish',
  'help','try','get','make','find','see','know','think','show','tell',
  // methodology verbs
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
  // qualifiers
  'illegal','legal','unauthorized','suspected','potential','possible',
  // ── Geographic terms (produce maps, not photos) ──
  // US states
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'hampshire','jersey','mexico','york','carolina','dakota','ohio','oklahoma',
  'oregon','pennsylvania','rhode','tennessee','texas','utah','vermont',
  'virginia','washington','wisconsin','wyoming',
  // Continents / major regions
  'africa','asia','europe','oceania','antarctica','arctic','antarctic',
  // Countries / major places (common in use-cases)
  'amazon','brazil','china','india','russia','australia','canada','congo',
  'sahara','mekong','indonesia','nigeria','kenya','ethiopia','peru','chile',
  // Generic geographic words
  'basin','delta','valley','coast','coastal','river','lake','ocean','sea',
  'mountain','range','peninsula','island','plateau','plain','plains',
  'region','area','zone','territory','province','state','county','district',
]);

// Maps subject keywords → a more descriptive Commons search query.
// For conservation use cases, show the healthy ecosystem (what's being protected),
// not the damage event.
const SUBJECT_QUERIES: Record<string, string> = {
  // Agriculture
  crop:           'crop field agriculture aerial green',
  crops:          'agricultural crops field aerial',
  agriculture:    'agricultural farmland aerial',
  farm:           'farm fields aerial view',
  farming:        'farming crops aerial view',
  // Forests & biodiversity
  forest:         'tropical rainforest canopy aerial',
  deforestation:  'tropical rainforest canopy biodiversity aerial',
  logging:        'tropical rainforest aerial green canopy',
  wildlife:       'wildlife biodiversity tropical forest',
  biodiversity:   'biodiversity wildlife tropical forest aerial',
  species:        'wildlife species tropical biodiversity',
  habitat:        'wildlife habitat forest aerial',
  conservation:   'wildlife conservation forest aerial',
  // Water & floods
  flood:          'river wetland floodplain aerial',
  flooding:       'river floodplain wetland aerial',
  wetland:        'wetland marsh aerial',
  mangrove:       'mangrove forest aerial',
  coral:          'coral reef aerial',
  reef:           'coral reef tropical aerial',
  water:          'lake river water body aerial',
  reservoir:      'reservoir lake aerial',
  // Fire & drought
  fire:           'wildfire aerial view',
  wildfire:       'wildfire aerial view',
  drought:        'drought dry cracked land aerial',
  // Infrastructure
  ship:           'cargo ship port aerial',
  shipping:       'shipping vessels port aerial',
  urban:          'urban development aerial',
  construction:   'construction site aerial',
  road:           'road infrastructure aerial',
  // Climate & land
  glacier:        'glacier ice mountain aerial',
  snow:           'snow cover mountain aerial',
  soil:           'agricultural field bare soil aerial',
  erosion:        'soil erosion land degradation aerial',
  mine:           'open pit mine aerial',
  mining:         'mining operation aerial view',
  oil:            'oil spill aerial',
  pipeline:       'pipeline infrastructure aerial',
  shoreline:      'shoreline coastal aerial',
  vegetation:     'vegetation green forest aerial',
  ndvi:           'green vegetation field aerial',
  biomass:        'forest biomass canopy aerial',
};

function extractKeywords(name: string): string[] {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  return words.slice(0, 3);
}

function buildSearchQuery(keywords: string[]): string {
  // Look for a subject-specific query enhancement first
  for (const kw of keywords) {
    if (SUBJECT_QUERIES[kw]) return SUBJECT_QUERIES[kw];
  }
  // Fallback: combine keywords + "aerial view" for nature photography
  return keywords.join(' ') + ' aerial view';
}

async function commonsImagesForQuery(query: string, limit: number): Promise<string[]> {
  // Search Wikimedia Commons (namespace 6 = File) for photos matching the query
  const searchRes = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${limit * 3}&format=json&origin=*`,
    { headers: { 'User-Agent': 'PlanetCentinela/1.0' } },
  );
  const searchData = await searchRes.json();
  const results: Array<{ title: string }> = searchData.query?.search ?? [];

  if (results.length === 0) return [];

  const titles = results.map((r) => r.title).slice(0, limit * 2);

  // Batch fetch image URLs
  const infoRes = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`,
    { headers: { 'User-Agent': 'PlanetCentinela/1.0' } },
  );
  const infoData = await infoRes.json();
  const pages = Object.values(infoData.query?.pages ?? {}) as Array<{
    imageinfo?: Array<{ thumburl?: string; url?: string }>;
  }>;

  const urls: string[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const url = info?.thumburl ?? info?.url;
    // Skip SVGs and non-photo formats
    if (url && !url.match(/\.(svg|gif|tiff|tif|pdf)(\?|$)/i)) {
      urls.push(url);
    }
    if (urls.length >= limit) break;
  }

  return urls;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? '';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '5', 10), 10);
  const keywords = extractKeywords(name);

  if (keywords.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  try {
    const primaryQuery = buildSearchQuery(keywords);
    const seen = new Set<string>();
    const all: string[] = [];

    const queries = [primaryQuery];
    // Fallback: try the raw keywords without the aerial context
    if (keywords.length > 1) queries.push(keywords.join(' '));

    for (const query of queries) {
      const batch = await commonsImagesForQuery(query, limit);
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
