// Cambiar versión cada vez que haya cambios visuales o de código
const CACHE_NAME = 'ajx-v3';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. Instalar y forzar al nuevo Service Worker a activarse sin esperar
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 2. Eliminar cachés antiguas automáticamente al activar la nueva versión
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key); // Borra la v1, v2, etc.
                    }
                })
            );
        }).then(() => self.clients.claim()) // Toma control de las pestañas abiertas
    );
});

// 3. Responder desde caché o descargar de la red
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});