/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openIDB(){
    DBHelper.idb =  idb.open('restaurants',1, upgradeDb => {
      let store = upgradeDb.createObjectStore('restaurants',{
        keyPath:'id'
      });
      let errorStore = upgradeDb.createObjectStore('error',{
        keyPath:'id'
      })
    })
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.idb.then((db) =>{
      const store = db.transaction('restaurants','readwrite').objectStore('restaurants');
      return store.getAll().then((restaurants) =>{
        if(restaurants.length == 0) {
          console.log("empty")
          fetch(DBHelper.DATABASE_URL).then(response => response.json()
          .then((data) =>{
            //console.log('store',store)
            data.forEach(item => {
              db.transaction('restaurants','readwrite').objectStore('restaurants').put(item);
            });
            callback(null,data);
          })
          );
        }
      else
        callback(null,restaurants)
      })
    });
    
    
    
    /*let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json.restaurants;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
    */
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
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
  static imageUrlForRestaurant(restaurant,option) {
    const root = restaurant.photograph;
    if(option == 'size')
      return (`/img/${root}-sm.jpg 400w, /img/${root}-lg.jpg 800w`);
    if(option == 'aspect')
      return (`/img/${root}-sm.jpg 1x, /img/${root}-lg.jpg 2x`);
    else
      return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

  static fetchReviews (id,callback) {
    fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`).then(
      responce => responce.json()
    .then(data =>{
      console.log(data)
      callback(data);
    }))
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static sendReview (review,callback) {
    fetch('http://localhost:1337/reviews/',{
      method: 'post',
      headers: {
        "Content-Type": "application/json; charset=utf-8",
    },
      body: JSON.stringify(review)
    }).then(response => {
      if(response.ok){
        return response.json()
      }
      else{
      throw Error(response.statusText);
      }
    }).then((data)=>{
      callback();
    }).catch((error) => {
      console.log('Request failed:', error.message)
      DBHelper.idb.then((db) =>{
        console.log("FAILED REVIEW", review)
        const store = db.transaction('error','readwrite').objectStore('error');
        //navigator.serviceWorker.controller.postMessage({"action": "savedMessage"})
        return store.put(review);
        
      });
    })
  }

  static reSubmitReviews (callback) {
    DBHelper.idb.then((db) =>{
      const store = db.transaction('error','readwrite').objectStore('error');
      //navigator.serviceWorker.controller.postMessage({"action": "savedMessage"})
      return store.getAll().then((reviews) => {
        reviews.forEach((review) => {
          DBHelper.sendReview(review,callback);
        })
      })
    }).then(DBHelper.idb.then((db)=> {
      const storeToClear = db.transaction('error','readwrite').objectStore('error');
      storeToClear.clear();
    })
  );
  }

  static favoriteRestaurant (id,callback) {
   
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=true`,{
      method: 'put'
    }).then(response => response.json().then(data => {
      DBHelper.idb.then((db) =>{
        const store = db.transaction('restaurants','readwrite').objectStore('restaurants');
        return store.put(data);
      });
    }));
  }

  static unfavoriteRestaurant (id,callback) {
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=false`,{
      method: 'put'
    }).then(response => response.json().then(data => {
      DBHelper.idb.then((db) =>{
        const store = db.transaction('restaurants','readwrite').objectStore('restaurants');
        return store.put(data);
      });
    }));
  }
}

