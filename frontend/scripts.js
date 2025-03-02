document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "http://localhost:5000"; // Backend server URL
    const API_KEY = "google api key";
    // Global variables
    let map = null; // Google Map instance
    let markers = []; // Array to store markers
    let userLocation = null; // User's current location

    /** Handle User Registration */
     // Replace with your OpenCage API key

function geocodeLocation(locationName, callback) {
    const encodedLocation = encodeURIComponent(locationName);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status.code === 200 && data.results.length > 0) {
                const location = data.results[0].geometry;
                callback(null, location); // Return latitude and longitude
            } else {
                callback("Location not found", null);
            }
        })
        .catch(error => {
            callback(error, null);
        });
}

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value;
            const phone = document.getElementById("phone").value;
            const bloodType = document.getElementById("blood-type").value;
            const location = document.getElementById("location").value;
            geocodeLocation(location, async (error, location) => {
                if (error) {
                    console.error("Error:", error);
                    alert("Unable to geocode the location. Please try again.");
                    return;
                }

                const lat = location.lat;
                const lng = location.lng;

            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, bloodType, location, lat, lng})
            });

            const data = await response.json();
            alert(data.message || "Registration failed!");
        });
    });
    }

    /** Handle Blood Search */
    function initMap() {
        // Check if the browser supports Geolocation
        if (navigator.geolocation) {
            // Get the user's current position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    // Create a new map instance centered on the user's location
                    map = new google.maps.Map(document.getElementById("map"), {
                        zoom: 12, // Set the zoom level
                        center: userLocation, // Set the center of the map to the user's location
                    });

                    // Add a marker to the map at the user's location
                    const marker = new google.maps.Marker({
                        position: userLocation, // Marker position
                        map: map, // Map instance to place the marker on
                        title: "Your Location", // Tooltip text
                        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Custom icon for user's location
                    });
                },
                (error) => {
                    // Handle errors (e.g., user denied location access)
                    console.error("Error getting user location:", error);
                    alert("Unable to retrieve your location. Please enable location access.");
                }
            );
        } else {
            // Browser doesn't support Geolocation
            alert("Your browser does not support Geolocation.");
        }
    }

    // Call the initMap function when the page loads
    

    /** Handle Blood Search Form Submission */
    const searchForm = document.querySelector("#search-section");
  
    if (searchForm) {
        window.onload = initMap;
        searchForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const bloodType = document.getElementById("blood-type").value;

            if (!userLocation) {
                alert("Please enable location access to search for donors.");
                return;
            }

            clearMarkers();

            // Fetch donors from the backend
            const response = await fetch(`${API_BASE_URL}/find-donors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bloodType, location: userLocation })
            });

            const data = await response.json();
            console.log(data);

            if (data.donors && data.donors.length > 0) {
                // Add markers for each donor
                data.donors.forEach(donor => {
                    if (donor.location && donor.location.lat && donor.location.lng) {
                        const position = {
                            lat: parseFloat(donor.location.lat),
                            lng: parseFloat(donor.location.lng),
                        };
                        addMarker(position, donor.name, donor.bloodType,donor.phone);
                    }
                });

                alert(`Found ${data.donors.length} donors. Markers added to the map.`);
            } else {
                alert("No donors found with the specified blood type.");
            }
        });
    }

    /** Function to Add a Marker to the Map */
    function addMarker(position, name, bloodType,phone) {
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: `${name} (${bloodType})`, // Tooltip text with donor name and blood type
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Custom icon for donors
        });
         // Create an Info Window
    const infoWindow = new google.maps.InfoWindow({
        content: `<strong>${name}</strong><br>Blood Type: ${bloodType}<br>phone: ${phone}`,
    });

    // Add a click event listener to the marker
    marker.addListener("click", () => {
        infoWindow.open(map, marker); // Open the Info Window
    });
        // Add the marker to the markers array
        markers.push(marker);
    }

    /** Function to Clear All Markers from the Map */
    function clearMarkers() {
        markers.forEach(marker => marker.setMap(null)); // Remove markers from the map
        markers = []; // Clear the markers array
    }

    /** Handle Blood Request */
    const requestForm = document.querySelector("#request-section");
    if (requestForm) {
        requestForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const patientName = "Anonymous";
            const bloodType = document.getElementById("blood-type").value;
            const location = document.getElementById("location").value;
            const contact = "contact@example.com";

            const response = await fetch(`${API_BASE_URL}/notify-donors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientName, bloodType, location, contact })
            });

            const data = await response.json();
            alert(data.message || "Blood request failed!");
        });
    }
});