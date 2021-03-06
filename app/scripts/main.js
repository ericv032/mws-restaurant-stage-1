let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Map toggle
 */

const toggle_map = () => {
if (document.getElementById('map').style.display === 'none')      document.getElementById('map').style.display = 'block'
else
document.getElementById('map').style.display = 'none'
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Fill cuisines HTML
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map
 */
window.initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: '<your MAPBOX API KEY HERE>',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
 window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
 updateRestaurants = () => {
   const cSelect = document.getElementById('cuisines-select');
   const nSelect = document.getElementById('neighborhoods-select');

   const cIndex = cSelect.selectedIndex;
   const nIndex = nSelect.selectedIndex;

   const cuisine = cSelect[cIndex].value;
   const neighborhood = nSelect[nIndex].value;

   DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
     if (error) { // Got an error!
       console.error(error);
     } else {
       resetRestaurants(restaurants);
       fillRestaurantsHTML();
     }
   })
 }

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create HTML restaurant
 */
 createRestaurantHTML = (restaurant) => {
   const li = document.createElement('li');

   const image = document.createElement('img');
   image.className = 'restaurant-img';
   image.src = DBHelper.imageUrlForRestaurant(restaurant);
   image.setAttribute('alt', `${restaurant.description}`);
   li.append(image); // Image attribute

   const name = document.createElement('h1');
   name.innerHTML = restaurant.name;
   li.append(name);

   const neighborhood = document.createElement('p');
   neighborhood.innerHTML = restaurant.neighborhood;
   li.append(neighborhood);

   const address = document.createElement('p');
   address.innerHTML = restaurant.address;
   li.append(address);

   const more = document.createElement('a');
   more.innerHTML = 'View Details';
   more.href = DBHelper.urlForRestaurant(restaurant);
   li.append(more)
   // Credit to James Priest for the source code
   const fav = document.createElement('button');
   fav.className = 'fav-control';
   fav.setAttribute('aria-label', 'favorite');
   if (restaurant.is_favorite === 'true') {
     fav.classList.add('active');
     fav.setAttribute('aria-pressed', 'true');
     fav.innerHTML = `Remove ${restaurant.name} as a favorite`;
     fav.title = `Remove ${restaurant.name} as a favorite`;
   } else {
     fav.setAttribute('aria-pressed', 'false');
     fav.innerHTML = `Add ${restaurant.name} as a favorite`;
     fav.title = `Add ${restaurant.name} as a favorite`;
   }
   fav.addEventListener('click', (evt) => {
     evt.preventDefault();
     if (fav.classList.contains('active')) {
       fav.setAttribute('aria-pressed', 'false');
       fav.innerHTML = `Add ${restaurant.name} as a favorite`;
       fav.title = `Add ${restaurant.name} as a favorite`;
       DBHelper.unMarkFavorite(restaurant.id);
     } else {
       fav.setAttribute('aria-pressed', 'true');
       fav.innerHTML = `Remove ${restaurant.name} as a favorite`;
       fav.title = `Remove ${restaurant.name} as a favorite`;
       DBHelper.markFavorite(restaurant.id);
     }
     fav.classList.toggle('active');
   });
   li.append(fav);

   return li
 }

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
