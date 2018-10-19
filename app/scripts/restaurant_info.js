var map;
let restaurant;

/**
 * Initialize Google map, called from HTML.
 */

window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				//map.style('display', 'none');
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			DBHelper.fetchRestaurantReviews(self.restaurant, (error, reviews) => {
				self.restaurant.reviews = reviews;
				if (!reviews) {
					console.error(error);
				}
				fillRestaurantHTML();
				callback(null, restaurant)
			});
		});
	}
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
    // Image attribute
  image.setAttribute('alt', `${restaurant.description}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // Fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // Fill reviews
  DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);
	// Credit to James Priest for the source code
	const favorite = document.getElementById('restaurant-fav');
	  if (restaurant.is_favorite === 'true') {
	    favorite.classList.add('active');
	    favorite.setAttribute('aria-pressed', 'true');
	    favorite.innerHTML = `Remove ${restaurant.name} as a favorite`;
	    favorite.title = `Remove ${restaurant.name} as a favorite`;
	  } else {
	    favorite.setAttribute('aria-pressed', 'false');
	    favorite.innerHTML = `Add ${restaurant.name} as a favorite`;
	    favorite.title = `Add ${restaurant.name} as a favorite`;
	  }
	  favorite.addEventListener('click', (evt) => {
	    evt.preventDefault();
	    if (favorite.classList.contains('active')) {
	      favorite.setAttribute('aria-pressed', 'false');
	      favorite.innerHTML = `Add ${restaurant.name} as a favorite`;
	      favorite.title = `Add ${restaurant.name} as a favorite`;
	      DBHelper.unMarkFavorite(restaurant.id);
	    } else {
	      favorite.setAttribute('aria-pressed', 'true');
	      favorite.innerHTML = `Remove ${restaurant.name} as a favorite`;
	      favorite.title = `Remove ${restaurant.name} as a favorite`;
	      DBHelper.markFavorite(restaurant.id);
	    }
	    favorite.classList.toggle('active');
	  });

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');
		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);
		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);
		hours.appendChild(row);
	}
}
/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews;

  if (error) {
    console.log('Error retrieving reviews', error);
  }
  const container = document.getElementById('reviews-container');
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);
  const createdAt = document.createElement('p');
  createdAt.classList.add('createdAt');
  const createdDate = new Date(review.createdAt).toLocaleDateString();
  createdAt.innerHTML = `Added:<strong>${createdDate}</strong>`;
  li.appendChild(createdAt);
  const rating = document.createElement('p');
  rating.classList.add('rating');
  rating.innerHTML = `Rating: ${review.rating} out of 5`;
  rating.dataset.rating = review.rating;
  li.appendChild(rating);
  const comments = document.createElement('p');
  comments.classList.add('comments');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};
/**
 * Form submission
 */
createFormSubmission = () => {
	const form = document.getElementById('review-form');
	form.addEventListener('submit', function (event) {
		event.preventDefault()
		let review = {'restaurant_id': self.restaurant.id};
		const formdata = new FormData(form);
		for (var [key, value] of formdata.entries()) {
			review[key] = value;
		}
		DBHelper.submitReview(review)
			.then(data => {
				const ul = document.getElementById('reviews-list');
				ul.appendChild(createReviewHTML(review));
				form.reset();
				form.style.display = 'none';
				const el = document.querySelector('.js-fade');
				if (el.classList.contains('is-paused')){
	  		el.classList.remove('is-paused');
				}
			}
		)
			.catch(error => console.error(error))
	});
}

/**
 * Get a parameter by name from page URL
 */
 getParameterByName = (name, url) => {
 	if (!url)
 		url = window.location.href;
 	name = name.replace(/[\[\]]/g, '\\$&');
 	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
 		results = regex.exec(url);
 	if (!results)
 		return null;
 	if (!results[2])
 		return '';
 	return decodeURIComponent(results[2].replace(/\+/g, ' '));

}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
}
