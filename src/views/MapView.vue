<template>
  <div class="about mt-5 row">
    <div class="col-md-8 offset-md-2">
      <h1 class="text-center">Youth Mental Health Map</h1>
      
      <!-- Button -->
      <div class="map-controls mb-3">
        <button 
          @click="getCurrentLocation" 
          class="btn btn-primary me-2"
          aria-label="Get current location"
        >
          <span class="button-icon">📍</span> Current Location
        </button>
        <button 
          @click="searchNearbyMentalHealthServices" 
          class="btn btn-success"
          aria-label="Find nearby youth mental health services"
        >
          <span class="button-icon">🏥</span> Find Youth Mental Health Services
        </button>
      </div>

      <!-- Status Message -->
      <div 
        v-if="statusMessage" 
        class="alert alert-info" 
        role="alert"
        aria-live="polite"
      >
        {{ statusMessage }}
      </div>

      <div class="map-container">
        <div 
          ref="mapEl" 
          class="map"
          role="application"
          aria-label="Interactive map showing youth mental health services"
        ></div>
      </div>

      <!-- Search Results List -->
      <div 
        v-if="searchResults.length > 0" 
        class="search-results mt-3"
        role="region"
        aria-label="Search results for youth mental health services"
      >
        <h2 class="h5">Nearby Youth Mental Health Services</h2>
        <ul class="list-group">
          <li 
            v-for="(result, index) in searchResults" 
            :key="index"
            class="list-group-item"
          >
            <strong>{{ result.name }}</strong><br>
            <small class="text-muted">{{ result.address }}</small>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ref, onMounted, onUnmounted } from 'vue'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import axios from 'axios'

// Map references and state variables
const mapEl = ref(null)
const statusMessage = ref('')
const searchResults = ref([])
let map = null
let searchMarker = null
let currentLocationMarker = null

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

onMounted(() => {
  initializeMap()
})

/**
 * Initialize the map
 */
function initializeMap() {
  // Create a new map instance
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/light-v11', 
    center: [144.9631, -37.8136], // Melbourne CBD
    zoom: 11,
    cooperativeGestures: true // Improve touch and keyboard accessibility
  })

  // Add navigation control
  map.addControl(new mapboxgl.NavigationControl(), 'top-left')

  // Add Melbourne CBD marker
  const center = [144.9631, -37.8136]
  new mapboxgl.Marker()
    .setLngLat(center)
    .setPopup(new mapboxgl.Popup({ offset: 8 }).setText('Melbourne CBD'))
    .addTo(map)

  // Add search control
  const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  placeholder: 'Search for places in Melbourne',
  marker: false,
  language: 'en',
  bbox: [144.0, -38.5, 146.0, -37.0], // Expand the search area to the entire Melbourne region
  proximity: { longitude: 144.9631, latitude: -37.8136 }
})

  map.addControl(geocoder, 'top-right')

  // Show search results
  geocoder.on('result', async (e) => {
    const coords = e.result?.center
    if (!coords) return
    
    const [lng, lat] = coords

    // Clear previous search result marker
    if (searchMarker) searchMarker.remove()
    
    // Add new marker
    searchMarker = new mapboxgl.Marker({ color: '#3FB1CE' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 8 }).setText(e.result.place_name || 'Selected location'))
      .addTo(map)

    // Show route
    const origin = map.getCenter()
    await showRoute([origin.lng, origin.lat], [lng, lat])

    // Search for nearby youth mental health services
    await searchNearbyMentalHealthServices(lng, lat)

    map.flyTo({ center: [lng, lat], zoom: 13 })
  })

  // Map load event
  map.on('load', () => {
    statusMessage.value = 'Map loaded successfully. Use the buttons above to find services or your current location.'
  })

  // Keyboard accessibility support
  map.getCanvas().setAttribute('tabindex', '0')
  map.getCanvas().setAttribute('aria-label', 'Interactive map. Use tab to navigate and enter to interact with markers.')
}

/**
 * Get current location
 */
function getCurrentLocation() {
  statusMessage.value = 'Getting your current location...'
  
  if (!navigator.geolocation) {
    statusMessage.value = 'Geolocation is not supported by your browser'
    return
  }

  navigator.geolocation.getCurrentPosition(
    // Success callback
    (position) => {
      const { longitude, latitude } = position.coords

      // Clear previous current location marker
      if (currentLocationMarker) currentLocationMarker.remove()

      // Add current location marker
      currentLocationMarker = new mapboxgl.Marker({ color: '#4CAF50' })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup({ offset: 8 }).setText('Your current location'))
        .addTo(map)

      // Fly to current location
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14
      })

      statusMessage.value = 'Found your location! Now searching for nearby youth mental health services...'

      // Search for nearby youth mental health services
      searchNearbyMentalHealthServices(longitude, latitude)
    },
    // Error callback
    (error) => {
      console.error('Error getting location:', error)
      switch(error.code) {
        case error.PERMISSION_DENIED:
          statusMessage.value = 'Location access denied. Please allow location access to use this feature.'
          break
        case error.POSITION_UNAVAILABLE:
          statusMessage.value = 'Location information unavailable.'
          break
        case error.TIMEOUT:
          statusMessage.value = 'Location request timed out.'
          break
        default:
          statusMessage.value = 'An unknown error occurred while getting your location.'
          break
      }
    },
    // Options - Enable high accuracy
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

/**
 * Search for nearby youth mental health services
 */
async function searchNearbyMentalHealthServices(lng = null, lat = null) {
  statusMessage.value = 'Searching for youth mental health services...'
  
  try {
    // Use current map center or provided location
    const center = lng && lat ? { lng, lat } : map.getCenter()
    const longitude = center.lng
    const latitude = center.lat

    // Search for youth mental health services
    const searchTerms = [
      'youth mental health',
      'youth counseling', 
      'teen mental health',
      'adolescent psychology',
      'youth support service',
      'headspace', 
      'youth crisis'
    ]

    searchResults.value = []

    // Execute search for each search term
    for (const term of searchTerms) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?proximity=${longitude},${latitude}&limit=5&country=AU&language=en&access_token=${mapboxgl.accessToken}`
      
      const response = await axios.get(url)
      
      if (response.data.features) {
        response.data.features.forEach(feature => {
          // Avoid duplicate results
          const exists = searchResults.value.some(result => 
            result.place_name === feature.place_name
          )
          
          if (!exists) {
            searchResults.value.push({
              name: feature.text,
              address: feature.place_name,
              coordinates: feature.center
            })

            // Add marker on the map
            new mapboxgl.Marker({ color: '#FF6B6B' })
              .setLngLat(feature.center)
              .setPopup(new mapboxgl.Popup({ offset: 8 })
                .setHTML(`
                  <div>
                    <strong>${feature.text}</strong><br>
                    <small>${feature.place_name}</small><br>
                    <em>Youth Mental Health Service</em>
                  </div>
                `))
              .addTo(map)
          }
        })
      }
    }

    statusMessage.value = `Found ${searchResults.value.length} youth mental health services near you.`

    // If there are results, adjust the map view to show all markers
    if (searchResults.value.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      searchResults.value.forEach(result => {
        bounds.extend(result.coordinates)
      })
      map.fitBounds(bounds, { padding: 50, maxZoom: 13 })
    }
    
  } catch (error) {
    console.error('Error searching for mental health services:', error)
    statusMessage.value = 'Error searching for mental health services. Please try again.'
  }
}

/**
 * Show route between two points
 */
async function showRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`

    const response = await axios.get(url)
    const routeGeometry = response.data.routes[0].geometry

    // Remove existing route
    if (map.getLayer('route')) map.removeLayer('route')
    if (map.getSource('road')) map.removeSource('road')

    // Add new route
    map.addSource('road', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: routeGeometry
      }
    })

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'road',
      layout: { 
        'line-cap': 'round', 
        'line-join': 'round' 
      },
      paint: {
        'line-color': '#3FB1CE',
        'line-width': 5,
        'line-opacity': 0.7
      }
    })
  } catch (error) {
    console.error('Error fetching route:', error)
  }
}

onUnmounted(() => {
  if (map) map.remove()
})
</script>

<style scoped>
.map-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.btn:focus {
  outline: 3px solid #3FB1CE;
  outline-offset: 2px;
}

.button-icon {
  font-size: 1.2em;
}

.map-container {
  width: 100%;
  height: 60vh;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map {
  width: 100%;
  height: 100%;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

/* High contrast mode support */
@media (prefers-conduced-motion: reduce) {
  .btn {
    transition: none;
  }
}

/* Reduce motion support */
@media (prefers-reduced-motion: reduce) {
  .map * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .map-container {
    height: 50vh;
  }
  
  .map-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>