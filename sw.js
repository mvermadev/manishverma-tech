/* ─────────────────────────────────────────
   Manish Verma — Portfolio Service Worker
   Strategy:
     Local assets  → cache-first, stale-while-revalidate in background
     Google Fonts  → cache-first (separate long-lived cache)
     Navigation    → serve from cache instantly, refresh cache in background
     POST / other  → pass through (form submissions, analytics)
   ───────────────────────────────────────── */

var CACHE_NAME  = 'manishverma-v3';       // bump on every new deploy
var FONTS_CACHE = 'manishverma-fonts-v1'; // fonts rarely change — keep separate

// Paths are built dynamically from the SW scope so the same sw.js works
// whether the site is served from / or /manishverma-tech/ or any subdirectory.
function getScopedAssets() {
    var base = self.registration.scope; // e.g. 'http://localhost:5500/manishverma-tech/'
    return [
        base,
        base + 'index.html',
        base + 'style.css',
        base + 'main.js',
        base + 'manifest.json',
        base + 'icons/favicon.svg',
        base + 'icons/logo.svg',
        base + 'icons/icon-192.svg',
        base + 'icons/icon-512.svg'
    ];
}

// ── Install: pre-cache every core asset before the SW activates ───────
// Cache assets individually so one 404 does NOT abort the whole install.
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            var assets  = getScopedAssets();
            var results = assets.map(function (url) {
                return cache.add(url).catch(function (err) {
                    console.warn('[SW] Failed to precache:', url, err);
                });
            });
            return Promise.all(results);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// ── Activate: delete stale caches, take control of all open tabs ──────
self.addEventListener('activate', function (event) {
    var KEEP = [CACHE_NAME, FONTS_CACHE];
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (k) { return KEEP.indexOf(k) === -1; })
                        .map(function (k) { return caches.delete(k); })
                );
            })
            .then(function () { return self.clients.claim(); })
    );
});

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Cache-first with background revalidation (stale-while-revalidate).
 * Returns the cached response immediately (offline-safe).
 * Fires a network request in the background to keep the cache fresh.
 * Falls back to the cached index.html shell when nothing else matches.
 */
function cacheFirstWithRevalidate(request, cacheName) {
    return caches.open(cacheName).then(function (cache) {
        return cache.match(request).then(function (cached) {

            // Background revalidation — runs whether or not we have a cached copy
            var networkUpdate = fetch(request)
                .then(function (response) {
                    if (response && response.status === 200) {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(function () { return null; });

            if (cached) {
                // Return cache immediately; network runs silently in background
                return cached;
            }

            // Nothing cached yet (first visit) — wait for network
            return networkUpdate.then(function (response) {
                if (response) return response;
                // Last resort: serve the cached scope root (index.html shell)
                return caches.match(self.registration.scope)
                    || caches.match(self.registration.scope + 'index.html');
            });
        });
    });
}

/**
 * Cache-first for Google Fonts (CORS + opaque cross-origin responses).
 * After first online visit fonts are available permanently offline.
 */
function fontCacheFirst(request) {
    return caches.open(FONTS_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
            if (cached) return cached;
            return fetch(request)
                .then(function (response) {
                    if (response && (response.status === 200 || response.type === 'opaque')) {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(function () { return null; });
        });
    });
}

// ── Fetch ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
    var request = event.request;
    var url;

    // Guard: skip non-HTTP schemes (chrome-extension://, data:, etc.)
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    // Only intercept GET — POST/PUT/DELETE go straight to network
    if (request.method !== 'GET') return;

    // ── Google Fonts ─────────────────────────────────────────────────
    if (url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com') {
        event.respondWith(fontCacheFirst(request));
        return;
    }

    // ── Same-origin: all pages and static assets ─────────────────────
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirstWithRevalidate(request, CACHE_NAME));
        return;
    }

    // ── Everything else (third-party CDN, analytics, form endpoints) ──
    // Pass through without caching — do not interfere
});
