const CACHE = "rushd-gift-v31";
const QT = "rushd-quran-text";
const QTU = "https://api.alquran.cloud/v1/quran/quran-uthmani";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "privacy.html", "journey.json", "a/9ad38d9743.otf", "a/dafbd0eb5b.ttf", "a/cfc62f6d46.webp", "a/51a5c835dd.webp", "a/1db58be49c.webp", "icon-180.png", "badge-96.png", "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png", "favicon.ico"];
self.addEventListener("install", function (e) {
  /* every item is cached on its own: one missing file never blocks the install */
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (a) { return c.add(new Request(a, { cache: "reload" })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("rushd-gift-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error("t")); }, ms); }); }
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.href.indexOf(QTU) === 0) {
    e.respondWith(caches.open(QT).then(function (c) { return c.match(QTU); }).then(function (h) { return h || fetch(req); }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    /* page: network first (fresh when online), fall back to the saved copy fast */
    e.respondWith(
      Promise.race([fetch(req), timeout(4000)]).then(function (r) {
        if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put("index.html", cp); }); return r; }
        return caches.match("index.html").then(function (h) { return h || r; });
      }).catch(function () {
        return caches.match("index.html").then(function (h) { return h || caches.match("./"); }).then(function (h) { return h || fetch(req); });
      })
    );
    return;
  }
  /* assets: saved copy first, refresh in the background */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (r) {
        if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
        return r;
      }).catch(function () { return hit; });
      return hit || fresh;
    })
  );
});
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(Promise.all([
    caches.open("rushd-nf").then(function (c) { return c.put("/gift/_nf/" + Date.now(), new Response(JSON.stringify({ t: d.title || "رشد", b: d.body || "", ts: Date.now() }))); }).catch(function () {}),
    self.registration.showNotification(d.title || "رشد", { body: d.body || "عندك حاجات مستنيةك النهارده", icon: "icon-512.png", badge: "badge-96.png", vibrate: [180, 90, 180, 90, 420], tag: "rushd-daily", renotify: true, silent: false, timestamp: Date.now(), dir: "rtl", lang: "ar", data: { url: d.url || "/gift/" } }),
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: "pushgot", body: d.body || "" }); }); })
  ]));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var u = (e.notification.data && e.notification.data.url) || "/gift/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (const c of cs) { if (c.url.indexOf("/gift/") >= 0) return c.focus(); }
    return clients.openWindow(u);
  }));
});
