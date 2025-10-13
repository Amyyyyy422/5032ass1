<template>
  <div class="about mt-5 row">
    <div class="col-md-8 offset-md-2">
      <h1 class="text-center">Maps</h1>
      <button @click="getCurrentLocation" class="location-button">Current location</button>
      <button @click="showRoute" class="route-button">Show route</button>
      <div class="map-container">
        <div id="map" class="map"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'

const map = ref(null)           // 地图实例
const currentLocation = ref(null) // 用户当前位置
const destination = ref(null)     // 目的地位置

// 设置 Mapbox Access Token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_KEY

// 初始化地图和搜索功能
onMounted(() => {
  console.log(import.meta.env.VITE_MAPBOX_ACCESS_KEY)
  // 初始化地图
  map.value = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: [144.9631, -37.8136], // Melbourne [lng, lat]
    zoom: 9 // starting zoom
    });

    // 添加Geocoder插件进行地点搜索
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false // 不自动添加标记
    });

    // 将Geocoder插入到地图
    map.value.addControl(geocoder);

    // 当选择一个搜索结果时，记录目的地坐标
    geocoder.on('result', (event) => {
      destination.value = event.result.geometry.coordinates;
      
      // 在地图上添加标记
        new mapboxgl.Marker()
            .setLngLat(destination.value)
            .addTo(map.value);
    });
});

// 获取用户当前位置
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      currentLocation.value = [longitude, latitude];

      // 在地图上显示当前位置
      new mapboxgl.Marker({ color: 'red' })
        .setLngLat(currentLocation.value)
        .addTo(map.value);

      // 将地图中心移动到当前位置
      map.value.flyTo({ center: currentLocation.value, zoom: 12 });
    }, (error) => {
      console.error('Error getting location:', error);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
};

// 显示从当前位置到目的地的路径
const showRoute = async () => {
  if (!currentLocation.value || !destination.value) {
    alert('Please first obtain your current location and search for the destination.');
    return;
  }

  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation.value[0]},${currentLocation.value[1]};${destination.value[0]},${destination.value[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  try {
    const response = await fetch(directionsUrl);
    const data = await response.json();
    const route = data.routes[0].geometry;

    // 在地图上显示路径
    map.value.addLayer({
      id: 'route',
      type: 'line',
      source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: route } },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });

    // 将地图视角调整以显示整个路径
    const bounds = new mapboxgl.LngLatBounds();
    route.coordinates.forEach(coord => bounds.extend(coord));
    map.value.fitBounds(bounds);
  } catch (error) {
    console.error('Error fetching directions:', error);
  }
</script>

<style>
</style>