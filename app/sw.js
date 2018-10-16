let staticCache = 'restaurant—reviews-static-v3';
let imagesCache = 'restaurant—reviews-static-v3';

const allCaches = [
	staticCache,
	imagesCache
];
const urlsToCache = [
				'/',
				'/index.html',
				'/restaurant.html',
	      '/css/styles.css',
	      '/scripts/dbhelper.js',
				'/scripts/idb.js',
	      '/scripts/main.js',
	      '/scripts/restaurant_info.js',
				'/sw.js',
	      '/img/1.jpg',
	      '/img/2.jpg',
	      '/img/3.jpg',
	      '/img/4.jpg',
	      '/img/5.jpg',
	      '/img/6.jpg',
	      '/img/7.jpg',
	      '/img/8.jpg',
	      '/img/9.jpg',
	      '/img/10.jpg',
	      '/offline.html',
	      '/404.html',
'https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic'
    ];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCache).then(function(cache) {
			console.log('Cache opened');
			return cache.addAll(urlsToCache);
		}).catch(error => console.log(`Open cache failed: ${error}`))
	);
});

self.addEventListener('activate', function (event) {
	console.log('Service Worker activated');

	event.waitUntil(
		caches.keys().then(function (cacheNames) {
			return Promise.all(
				cacheNames.filter(function (thisCacheName) {
					return thisCacheName.startsWith('restaurant-') && !allCaches.includes(thisCacheName);
				}).map(function (thisCacheName) {
					return caches.delete(thisCacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', (event) => {
	const requestUrl = new URL(event.request.url);
	if (requestUrl.pathname.startsWith('/img/')) {
		event.respondWith(serveImage(event.request));
		return;
	}

	event.respondWith(
		caches.match(event.request).then(response => {
			if (response) {
				console.log(`Service worker found in cache: ${event.request.url}`);
				return response;
			}
			return fetch(event.request).then(networkResponse => {
				if (networkResponse.status === 404) {
					return;
				}
				return caches.open(staticCache).then(cache => {
					cache.put(event.request.url, networkResponse.clone());
					return networkResponse;
				})
			})
		}).catch(error => {
			console.log('Error:', error);
			return;
		})
	);
});

serveImage = (request) => {

	return caches.open(imagesCache).then(function (cache) {
		return cache.match(request.url).then(function (response) {
			if (response) return response;

			return fetch(request).then(function (networkResponse) {
				cache.put(request.url, networkResponse.clone());
				return networkResponse;
			});
		});
	});
}

self.addEventListener('message', (event) => {
    console.log(event);

    if (event.data.action === 'skipWaiting') {
       self.skipWaiting();
    }
});

self.addEventListener('sync', function (event) {
	if (event.tag == 'myFirstSync') {
		const DBOpenRequest = indexedDB.open('restaurants', 1);
		DBOpenRequest.onsuccess = function (e) {
			db = DBOpenRequest.result;
			let tx = db.transaction('offline-reviews', 'readwrite');
			let store = tx.objectStore('offline-reviews');
			let request = store.getAll();
			request.onsuccess = function () {
				for (let i = 0; i < request.result.length; i++) {
					fetch(`http://localhost:1337/reviews/`, {
						body: JSON.stringify(request.result[i]),
						cache: 'no-cache',
						credentials: 'same-origin',
						headers: {
							'content-type': 'application/json'
						},
						method: 'POST',
						mode: 'cors',
						redirect: 'follow',
						referrer: 'no-referrer',
					})
					.then(response => {
						return response.json();
					})
					.then(data => {
						let tx = db.transaction('all-reviews', 'readwrite');
						let store = tx.objectStore('all-reviews');
						let request = store.add(data);
						request.onsuccess = function (data) {
							let tx = db.transaction('offline-reviews', 'readwrite');
							let store = tx.objectStore('offline-reviews');
							let request = store.clear();
							request.onsuccess = function () {
								console.log('this runs but empty');
							 };
							request.onerror = function (error) {
								console.log('Unable to clear offline-reviews objectStore', error);
							}
						};
						request.onerror = function (error) {
							console.log('Unable to add objectStore to IDB', error);
						}
					})
					.catch(error => {
						console.log('Unable to make a POST fetch', error);
					})
				}
			}
			request.onerror = function (e) {
				console.log(e);
			}
		}
		DBOpenRequest.onerror = function (e) {
			console.log(e);
		}
	}
});
