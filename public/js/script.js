const socket = io();
const markers = {}; // Store markers by user ID

// Initialize the map
const map = L.map('map').setView([0, 0], 16);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize the routing control
let control = null; // Routing control will be initialized on marker click

// Function to update routing control with selected destination
const updateRoute = (start, end) => {
    // Remove any existing route
    if (control) {
        map.removeControl(control);
    }

    // Add a new routing control with the selected start and end points
    control = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        routeWhileDragging: false,
    }).addTo(map);
};

// Watch for geolocation
let userLocation = null; // Store the user's current location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            socket.emit("send-location", { latitude, longitude });
            map.setView([latitude, longitude], 16); // Center the map on the user's location

            // Add a marker for the user's location if it doesn't exist
            if (!markers['self']) {
                markers['self'] = L.marker([latitude, longitude]).addTo(map);
                markers['self'].bindPopup("Your location").openPopup();
            } else {
                markers['self'].setLatLng([latitude, longitude]);
            }
        },
        (error) => {
            console.error("Geolocation error: ", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Listen for location updates from other users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Update existing marker or create a new one if it doesn't exist
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
        markers[id].bindPopup(`User ${id}`);

        // Add a click event to show the route to the clicked marker
        markers[id].on('click', () => {
            if (userLocation) {
                updateRoute(userLocation, { lat: latitude, lng: longitude });
            } else {
                alert("Unable to get your current location.");
            }
        });
    }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
