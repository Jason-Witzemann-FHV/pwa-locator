import { manifest } from '@parcel/service-worker';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { warmStrategyCache } from 'workbox-recipes';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';


// Set up page cache
const assetsCache = new StaleWhileRevalidate({
    cacheName: 'asset-cache',
    plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        })
    ],
});

const imageCache = new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        new ExpirationPlugin({
            maxAgeSeconds: 24 * 60 * 60,
            maxEntries: 100,
        }),
    ],
});

const tileCache = new CacheFirst({
    cacheName: 'tile-cache',
    plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        new ExpirationPlugin({
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxEntries: 100,
        }),
    ],
});

console.debug(`serviceworker.js got manifest: ${manifest}`);

warmStrategyCache({
    urls: manifest.filter(urlPath => /\.(html|css|js)/.test(urlPath)),
    strategy: assetsCache,
});

warmStrategyCache({
    urls: manifest.filter(urlPath => /\.(png|svg)/.test(urlPath)),
    strategy: imageCache,
});

registerRoute(
    ({ url }) => {
        console.debug(`registerRoute for url.hostname: ${url.hostname}`);
        return url.hostname === 'tile.openstreetmap.org';
    }, tileCache);
