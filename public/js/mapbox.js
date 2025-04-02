/* eslint-disable */
export const displayMap = locations => {
  if (!locations || !locations.length) {
    console.error('❌ No locations provided.');
    return;
  }

  // Initialize the map (Leaflet expects [latitude, longitude])
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: true,
    dragging: true,
    touchZoom: false
  }).setView(
    [locations[0].coordinates[1], locations[0].coordinates[0]], // [lat, lng]
    10
  );

  // Add the OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const bounds = L.latLngBounds();

  locations.forEach(loc => {
    if (!loc.coordinates || loc.coordinates.length !== 2) {
      console.error('❌ Invalid location:', loc);
      return;
    }

    // Define a custom marker icon (make sure /img/pin.png exists)
    const customIcon = L.icon({
      iconUrl: '/img/pin.png',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      className: 'custom-marker'
    });

    // Add a marker to the map
    const marker = L.marker(
      [loc.coordinates[1], loc.coordinates[0]], // [lat, lng]
      { icon: customIcon }
    ).addTo(map);

    // Bind a popup with location info
    marker.bindPopup(
      `<p class="marker-popup">Day ${loc.day}: ${loc.description}</p>`
    );

    // Extend the bounds for fitting the view
    bounds.extend([loc.coordinates[1], loc.coordinates[0]]);
  });

  // Fit the map view to the markers
  map.fitBounds(bounds, { padding: [200, 150] });
};
