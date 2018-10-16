class DBHelper {
	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337 // Change this to your server port
		return `http://localhost:${port}`
	}
	/**
	 * IndexedDB
	 */
	static get dbPromise() {
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		} else {
			return idb.open('restaurants', 1, function (upgradeDb) {
				upgradeDb.createObjectStore('AllRestaurants', { keyPath: 'id' });
				upgradeDb.createObjectStore('AllReviews', { keyPath: 'id' });
				upgradeDb.createObjectStore('OfflineReviews', { keyPath: 'updatedAt' });
			});
		}
	}
	/**
	 * Fetch all restaurants
	 */

	static fetchRestaurants(callback) {
		DBHelper.dbPromise.then(db => {
			if (!db) return;

			const tx = db.transaction('AllRestaurants');
			const store = tx.objectStore('AllRestaurants');

			store.getAll().then(results => {
				if (results.length === 0) {

					fetch(`${DBHelper.DATABASE_URL}/restaurants`)
					.then(response => {
						return response.json();
					})
					.then(restaurants => {
						const tx = db.transaction('AllRestaurants', 'readwrite');
						const store = tx.objectStore('AllRestaurants');
						restaurants.forEach(restaurant => {
							store.put(restaurant);
						})
						callback(null, restaurants);
					})
					.catch(error => {
						callback(error, null);
					});
				} else {
					callback(null, results);
				}
			})

		});
	}
	/**
	 * Fetch a restaurant by id
	 */
	static fetchRestaurantById(id, callback) {
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find(r => r.id == id);
				if (restaurant) {
					callback(null, restaurant);
				} else {
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine
	 */
	static fetchRestaurantByCuisine(cuisine, callback) {
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants
				if (cuisine != 'all') {
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') {
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}
	/**
	 * Fetch all neighborhoods
	 */
	static fetchNeighborhoods(callback) {
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
				callback(null, uniqueNeighborhoods);
			}
		});
	}
	/**
	 * Fetch All Restaurants
	 */
	static fetchCuisines(callback) {
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
				callback(null, uniqueCuisines);
			}
		});
	}
	/**
	 * Fetch all reviews for a restaurant
	 */
	static fetchRestaurantReviews(restaurant, callback) {
		DBHelper.dbPromise.then(db => {
			if (!db) return;

			const tx = db.transaction('AllReviews');
			const store = tx.objectStore('AllReviews');
			store.getAll().then(results => {

				if (results && results.length > 0) {
					callback(null, results);
				} else {
					fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
					.then(response => {
						return response.json();
					})
					.then(reviews => {
						this.dbPromise.then(db => {
							if (!db) return;
							const tx = db.transaction('AllReviews', 'readwrite');
							const store = tx.objectStore('AllReviews');
							reviews.forEach(review => {
								store.put(review);
							})
						});
						callback(null, reviews);
					})
					.catch(error => {
						callback(error, null);
					})
				}
			})
		});
	}

  static fetchRestaurantReviewsById(id, callback) {
  fetch(DBHelper.DATABASE_URL + `/reviews/?restaurant_id=${id}`)
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(err => callback(err, null));
}
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
	/**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.id}.jpg`);
  }
	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		}
		);
		return marker;
	}
	/**
	 * Submit Review
	 */
	static submitReview(data) {
		console.log(data);

		return fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
			body: JSON.stringify(data),
			cache: 'no-cache',
			headers: {
				'content-type': 'application/json'
			},
			method: 'POST',
			mode: 'cors',
			redirect: 'follow',
			referrer: 'no-referrer'
		})
		.then(response => {
			response.json()
				.then(data => {
					this.dbPromise.then(db => {
						if (!db) return;
						const tx = db.transaction('AllReviews', 'readwrite');
						const store = tx.objectStore('AllReviews');
						store.put(data);
					});
					return data;
				})
		})
		.catch(error => {
			data['updatedAt'] = new Date().getTime();
			console.log(data);

			this.dbPromise.then(db => {
				if (!db) return;
				const tx = db.transaction('OfflineReviews', 'readwrite');
				const store = tx.objectStore('OfflineReviews');
				store.put(data);
				console.log('Review stored offline in IDB');
			});
			return;
		});
	}

	/**
	 * Submit Offline Reviews
	 */
	static submitOfflineReviews() {
		DBHelper.dbPromise.then(db => {
			if (!db) return;
			const tx = db.transaction('OfflineReviews');
			const store = tx.objectStore('OfflineReviews');
			store.getAll().then(OfflineReviews => {
				console.log(OfflineReviews);
				offlineReviews.forEach(review => {
					DBHelper.submitReview(review);
				})
				DBHelper.clearOfflineReviews();
			})
		})
	}
	/**
	 * Clear Offline Reviews
	 */
	static clearOfflineReviews() {
		DBHelper.dbPromise.then(db => {
			const tx = db.transaction('OfflineReviews', 'readwrite');
			const store = tx.objectStore('fflineReviews').clear();
		})
		return;
	}

}
