import { ENEMY_TRANSLATIONS } from '../../data/rules/features.js';

export function googleImagesUrl(name) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} dnd 5e monster token`)}`;
}

async function tryWikipediaSummary(lang, title) {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.thumbnail?.source || json.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function tryWikimediaCommons(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=360&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    for (const p of Object.values(json.query?.pages || {})) {
      const src = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
      if (src && /\.(jpe?g|png|webp|svg)/i.test(src)) return src;
    }
    return null;
  } catch {
    return null;
  }
}

export async function findAutoEnemyImageUrl(rawName) {
  const cleaned = String(rawName || '').trim().toLowerCase().replace(/\s+\d+$/, '').trim();
  if (!cleaned) return null;
  const translated = ENEMY_TRANSLATIONS[cleaned]
    || Object.entries(ENEMY_TRANSLATIONS).find(([k]) => cleaned.includes(k))?.[1]
    || cleaned;

  return (await tryWikipediaSummary('es', cleaned))
    || (await tryWikipediaSummary('en', `${translated} (Dungeons & Dragons)`))
    || (await tryWikipediaSummary('en', translated))
    || (await tryWikimediaCommons(`${translated} monster fantasy`))
    || (await tryWikimediaCommons(cleaned));
}
