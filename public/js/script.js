const socket = io();

// Initialize the map
const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: 'Trace'
}).addTo(map);

const markers = {};  // To track markers for all users

// Watch the user's location
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit('send-location', { latitude, longitude }); // Send user's location

      // Add or update the user's own marker
      if (!markers['self']) {
        markers['self'] = L.marker([latitude, longitude]).addTo(map);
      } else {
        markers['self'].setLatLng([latitude, longitude]);
      }

      map.setView([latitude, longitude], 18);  // Zoom in on user's location
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// Listen for location updates from other users
socket.on("received-location", (data) => {
  const { id, latitude, longitude } = data;

  // Ignore self updates to prevent duplicate markers
  if (id === socket.id) return;

  // Add or update markers for other users
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

// Remove the marker of a disconnected user
socket.on('user-disconnected', (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
