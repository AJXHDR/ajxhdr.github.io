const CACHE_NAME = 'ajx-v10';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './modules/metadata-cleaner.html',
    './modules/metadata-cleaner.js',
    './modules/link-resolver.js'
];

// 1. Instalar y forzar descarga limpia ignorando la caché HTTP del navegador
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Fuerza a pedir cada archivo directamente al servidor de GitHub
            return Promise.all(
                ASSETS.map((url) => {
                    return fetch(url, { cache: 'no-cache' }).then((response) => {
                        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
                        return cache.put(url, response);
                    });
                })
            );
        })
    );
});

// 2. Eliminar cachés antiguas y tomar control de clientes activos inmediatamente
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Estrategia Network-First para HTML y JS (Red primero -> respaldo en Caché)
self.addEventListener('fetch', (e) => {
    // Si la petición es para archivos de la app (.html, .js, .css o navegación)
    if (e.request.mode === 'navigate' || e.request.url.endsWith('.js') || e.request.url.endsWith('.html') || e.request.url.endsWith('.css')) {
        e.respondWith(
            fetch(e.request)
                .then((networkResponse) => {
                    // Si la red responde bien, actualiza la caché y devuelve el archivo nuevo
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(e.request)) // Si no hay internet, usa la caché
        );
    } else {
        // Para imágenes u otros recursos estáticos: Caché primero -> respaldo en Red
        e.respondWith(
            caches.match(e.request).then((res) => res || fetch(e.request))
        );
    }
});