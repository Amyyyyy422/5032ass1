<template>
  <div class="about mt-5 row">
    <div class="col-md-8 offset-md-2">
      <h1 class="text-center">Map</h1>
      <!--
      <button @click="getCurrentLocation" class="location-button">Current location</button>
      <button @click="showRoute" class="route-button">Show route</button>
      -->
      <div class="map-container">
        <div ref="mapEl" class="map"></div>
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

import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'

import axios from 'axios'

const mapEl = ref(null)
let map 
let searchMarker = null

onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-left')

  const center = [144.9631, -37.8136]
  new mapboxgl.Marker()
    .setLngLat(center)
    .setPopup(new mapboxgl.Popup({ offset: 8 }).setText('Melbourne CBD'))
    .addTo(map)

  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl,
    placeholder: 'Search places',
    marker: false,
    language: 'en'
  })
  map.addControl(geocoder, 'top-right')

  geocoder.on('result', async (e) => {
    const coords = e.result?.center
    console.log(e.result)
    if (!coords) return
    const [lng, lat] = coords

    if (searchMarker) searchMarker.remove()
    searchMarker = new mapboxgl.Marker({ color: '#3FB1CE' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 8 }).setText(e.result.place_name || 'Selected place'))
      .addTo(map)

    const origin = map.getCenter()

    // Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${lng},${lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`

    const res = await axios.get(url)
    const data = res.data.routes[0].geometry
    const url2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/gym.json
  ?proximity=144.9631,-37.8136
  &limit=10
  &country=AU
  &language=en
  &access_token=${mapboxgl.accessToken}`.replace(/\s+/g, '') 

    const res2 = await axios.get(url2)
    console.log(res2.data)
    
    if (map.getSource('road')) {
      map.removeLayer('route')
      map.removeSource('road')
    }

    map.addSource('road', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: data
      }
    })

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'road',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#3FB1CE',
        'line-width': 5
      }
    })

    map.flyTo({ center: [lng, lat], zoom: 12 })
  })
})

onUnmounted(() => map?.remove())
</script>

<style>
.map-container {
  width: 100%;
  height: 60vh;       
  border-radius: 8px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;      
}
</style>