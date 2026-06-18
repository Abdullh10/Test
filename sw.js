const CACHE_NAME = "exam-tracker-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// نتعامل فقط مع ملفات الواجهة الثابتة لتفعيل التثبيت والعمل دون اتصال؛
// أي طلب آخر (Supabase API، خطوط، مكتبات CDN) يُترك للشبكة كما هو دون أي تدخل
// حتى لا يتأثر تزامن البيانات الحساسة بأي خطأ في ذاكرة التخزين المؤقت.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isShellAsset = APP_SHELL.some((p) => {
    const clean = p.replace("./", "");
    return clean === "" ? url.pathname.endsWith("/") : url.pathname.endsWith(clean);
  });
  if (!isShellAsset) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
