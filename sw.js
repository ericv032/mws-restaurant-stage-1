var CACHE_NAME = 'restaurant—reviews-static-v3';
var urlsToCache = [
	'app/index.html',
	'app/restaurant.html',
      'app/css/styles.css',
      'app/scripts/dbhelper.js',
			'app/scripts/idb.js',
      'app/scripts/main.js',
      'app/scripts/restaurant_info.js',
			'/sw.js',
      'app/img/1.jpg',
      'app/img/2.jpg',
      'app/img/3.jpg',
      'app/img/4.jpg',
      'app/img/5.jpg',
      'app/img/6.jpg',
      'app/img/7.jpg',
      'app/img/8.jpg',
      'app/img/9.jpg',
      'app/img/10.jpg',
      'app/offline.html',
      'app/404.html',
'https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic'
    ];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});


self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', function(event) {

  var cacheWhitelist = ['restaurant—reviews-static-v3'];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
