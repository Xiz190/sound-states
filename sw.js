const CACHE = 'sound-states-v7';   // 9-24 大改版:换版本号,让旧缓存(图片)失效

// 核心文件:network-first(总是拿最新版) / core files: always fetch fresh
const NETWORK_FIRST = ['.html', '.css', '.js'];
// 图片:cache-first(不常变) / images: cache-first (rarely change)
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'];

self.addEventListener('install', e => {
  // 跳过等待,立刻激活新 SW / skip waiting so new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // 删掉所有旧版本缓存 / delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 音频文件完全跳过(体积大) / skip audio entirely
  if (url.match(/\.(wav|mp3|ogg|flac|aac)(\?.*)?$/i)) return;

  // 只处理同源请求 / only handle same-origin
  if (!url.startsWith(self.location.origin)) return;

  const path = new URL(url).pathname;
  const ext  = path.substring(path.lastIndexOf('.')).toLowerCase();

  // HTML / CSS / JS → network-first
  if (NETWORK_FIRST.includes(ext) || path === '/' || !ext) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // 成功拿到新版,存入缓存备用 / cache fresh response as fallback
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request)) // 离线时回退缓存 / offline fallback
    );
    return;
  }

  // 图片 → cache-first
  if (IMAGE_EXTS.includes(ext)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        });
      })
    );
    return;
  }

  // 其他文件 → network-first 兜底 / everything else: network-first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
