// Classic content-script helper injected into nivel20.com isolated world
(() => {
  const ns = (globalThis.__rondaN20 = globalThis.__rondaN20 || {});
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

  function extractBgUrl(el) {
    try {
      const bg = getComputedStyle(el).backgroundImage || '';
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/i);
      return m ? m[1] : '';
    } catch {
      return '';
    }
  }

  function isIgnoredImageUrl(src) {
    if (!src) return true;
    return /^data:image\/svg|logo|favicon|sprite|spinner|loading|google|recaptcha|facebook|twitter|discord|patreon|icon[_-]/i.test(src);
  }

  async function toPermanentAvatar(url) {
    if (!url || url.startsWith('data:image/')) return url;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return url;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return url;
      const bitmap = await createImageBitmap(blob);
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.86);
    } catch {
      return url;
    }
  }

  function findBestImageInRoot(root, charName = '', limitTop = 700) {
    const candidates = [];
    const normName = clean(charName).toLowerCase();

    root.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src || '';
      if (isIgnoredImageUrl(src)) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28) return;
      if (root === document && rect.top < 64 && rect.width <= 42 && rect.right > window.innerWidth - 260) return;

      let score = 0;
      const alt = clean(img.alt).toLowerCase();
      const cls = `${img.className || ''} ${img.parentElement?.className || ''}`.toLowerCase();
      if (normName && alt && (alt.includes(normName) || normName.includes(alt))) score += 70;
      if (/character|avatar|portrait|profile|sheet|ficha|token|image|photo/i.test(cls)) score += 35;
      if (/active_storage|blobs|uploads|cloudinary|s3|cloudfront|avatar|character|portrait/i.test(src)) score += 40;
      if (rect.width >= 56 && rect.height >= 56) score += 20;
      if (root === document && rect.top >= 0 && rect.top < limitTop) score += 15;
      const ratio = rect.width / Math.max(1, rect.height);
      if (ratio >= 0.55 && ratio <= 1.8) score += 15;
      candidates.push({ src, score });
    });

    root.querySelectorAll('div, span, a, figure').forEach(el => {
      const cls = `${el.className || ''}`.toLowerCase();
      const styleAttr = el.getAttribute('style') || '';
      if (!styleAttr.includes('background') && !/avatar|portrait|image|photo|thumb|character|token|pic/i.test(cls)) return;
      const src = extractBgUrl(el);
      if (isIgnoredImageUrl(src)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28) return;
      if (root === document && rect.top < 64 && rect.width <= 42 && rect.right > window.innerWidth - 260) return;

      let score = 15;
      if (/character|avatar|portrait|profile|token|thumb/i.test(cls)) score += 40;
      if (/active_storage|blobs|uploads|cloudinary|s3|cloudfront|avatar|character/i.test(src)) score += 40;
      if (rect.width >= 48 && rect.height >= 48) score += 20;
      if (root === document && rect.top >= 0 && rect.top < limitTop) score += 15;
      candidates.push({ src, score });
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.src || '';
  }

  ns.clean = clean;
  ns.toPermanentAvatar = toPermanentAvatar;
  ns.findBestImageInRoot = findBestImageInRoot;
})();
