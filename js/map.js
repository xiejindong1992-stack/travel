/**
 * map.js — Interactive map view
 * Leaflet map with markers and polylines connecting destinations.
 */
let mapInstance = null;
let markersLayer = null;
let polylineLayer = null;

function renderMap() {
  const page = document.getElementById('page-map');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tl = (zh, en) => (lang === 'en' && en ? en : zh);

  page.innerHTML = `<div class="container"><div class="map-container" id="map-container"><div id="map"></div></div></div>`;

  // Wait for DOM update then init map
  setTimeout(() => initMap(tl), 100);
}

function initMap(tl) {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Destroy previous instance
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  mapInstance = L.map('map', {
    center: [20, 100],
    zoom: 3,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);
  polylineLayer = L.layerGroup().addTo(mapInstance);

  const trips = DataStore.getTrips();
  if (trips.length === 0) {
    // Show a gentle message overlay
    return;
  }

  // Build points array in chronological order
  const sorted = [...trips].sort((a, b) => a.dateRange.start.localeCompare(b.dateRange.start));
  const points = [];
  const visited = {};

  for (const trip of sorted) {
    const { lat, lng } = trip.coordinates;
    if (!lat || !lng) continue;

    const destKey = `${trip.country}-${trip.destinations[0]}`;
    visited[destKey] = (visited[destKey] || 0) + 1;
    const count = visited[destKey];

    const title = tl(trip.title, trip.titleEn);
    const dest = tl(trip.destinations.join(', '), trip.destinationsEn.join(', '));
    const dateStr = `${trip.dateRange.start} – ${trip.dateRange.end}`;

    const marker = L.circleMarker([lat, lng], {
      radius: count > 1 ? 10 : 7,
      color: '#c93',
      fillColor: '#c93',
      fillOpacity: 0.6,
      weight: 1.5
    });

    const popupContent = `<div class="trip-popup">
      <h3>${title}</h3>
      <p>${dest}</p>
      <p>${dateStr}</p>
      <a href="#trip/${trip.slug}">${tl('查看详情 →', 'View details →')}</a>
    </div>`;

    marker.bindPopup(popupContent);
    markersLayer.addLayer(marker);
    points.push([lat, lng]);
  }

  // Draw polylines connecting destinations in order
  if (points.length > 1) {
    const polyline = L.polyline(points, {
      color: '#c93',
      weight: 1.5,
      opacity: 0.4,
      dashArray: '6, 6'
    });
    polylineLayer.addLayer(polyline);

    // Fit bounds to show all markers
    mapInstance.fitBounds(polyline.getBounds().pad(0.2));
  } else if (points.length === 1) {
    mapInstance.setView(points[0], 6);
  }
}
