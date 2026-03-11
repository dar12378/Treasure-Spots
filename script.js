const spots = [
  {
    id: 1,
    name: "Hidden Beach Corner",
    country: "Israel",
    city: "Tel Aviv",
    description: "A quiet beach spot perfect for sunset and peaceful time away from crowds.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    lat: 32.0853,
    lng: 34.7818
  },
  {
    id: 2,
    name: "Secret Rooftop View",
    country: "Israel",
    city: "Tel Aviv",
    description: "A rooftop city view that feels like a hidden local treasure.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    lat: 32.0809,
    lng: 34.7806
  },
  {
    id: 3,
    name: "Old Stone Alley",
    country: "Israel",
    city: "Jaffa",
    description: "A charming alley with historic vibes, perfect for photos and slow walks.",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
    lat: 32.0500,
    lng: 34.7522
  },
  {
    id: 4,
    name: "Forest Path Escape",
    country: "Israel",
    city: "Jerusalem",
    description: "A peaceful walking path for people who want nature inside the city.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    lat: 31.7683,
    lng: 35.2137
  },
  {
    id: 5,
    name: "Sunrise Viewpoint",
    country: "France",
    city: "Paris",
    description: "A special sunrise view with a quiet atmosphere before the city wakes up.",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
    lat: 48.8566,
    lng: 2.3522
  },
  {
    id: 6,
    name: "Hidden Garden Walk",
    country: "France",
    city: "Paris",
    description: "A peaceful route hidden between beautiful old streets.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    lat: 48.8606,
    lng: 2.3376
  },
  {
    id: 7,
    name: "Canal Escape Spot",
    country: "Netherlands",
    city: "Amsterdam",
    description: "A calm canal-side place ideal for photos and quiet evening moments.",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1200&q=80",
    lat: 52.3676,
    lng: 4.9041
  },
  {
    id: 8,
    name: "Cozy Art Corner",
    country: "Netherlands",
    city: "Amsterdam",
    description: "A small hidden art street with charm, color, and a local feel.",
    image: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80",
    lat: 52.3702,
    lng: 4.8952
  }
];

const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const searchInput = document.getElementById("searchInput");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const useMyLocationBtn = document.getElementById("useMyLocationBtn");
const travelModeSelect = document.getElementById("travelModeSelect");

const placesList = document.getElementById("placesList");
const emptyPlacesMessage = document.getElementById("emptyPlacesMessage");
const resultsCount = document.getElementById("resultsCount");
const locationStatus = document.getElementById("locationStatus");
const routeInfo = document.getElementById("routeInfo");

let selectedCountry = "";
let selectedCity = "";
let searchTerm = "";

let map;
let markers = [];
let userMarker = null;
let routeLine = null;
let activeUserLocation = null;

function initMap() {
  map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function createPinIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="custom-pin"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24]
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="user-pin"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function populateCountries() {
  const countries = [...new Set(spots.map((spot) => spot.country))].sort();

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

function populateCities(country) {
  citySelect.innerHTML = '<option value="">Select city</option>';

  if (!country) {
    citySelect.disabled = true;
    return;
  }

  const cities = [...new Set(
    spots
      .filter((spot) => spot.country === country)
      .map((spot) => spot.city)
  )].sort();

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

function getFilteredSpots() {
  return spots.filter((spot) => {
    const countryMatch = selectedCountry ? spot.country === selectedCountry : true;
    const cityMatch = selectedCity ? spot.city === selectedCity : true;
    const text = `${spot.name} ${spot.city} ${spot.country} ${spot.description}`.toLowerCase();
    const searchMatch = searchTerm ? text.includes(searchTerm.toLowerCase()) : true;

    return countryMatch && cityMatch && searchMatch;
  });
}

function clearMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
}

function renderMarkers() {
  clearMarkers();

  if (!selectedCountry || !selectedCity) {
    return;
  }

  const filteredSpots = getFilteredSpots();

  filteredSpots.forEach((spot) => {
    const marker = L.marker([spot.lat, spot.lng], {
      icon: createPinIcon()
    }).addTo(map);

    marker.bindPopup(`
      <div style="min-width: 200px;">
        <h3>${escapeHtml(spot.name)}</h3>
        <p><strong>${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</strong></p>
        <p>${escapeHtml(spot.description)}</p>
      </div>
    `);

    marker.spotId = spot.id;
    markers.push(marker);
  });

  fitMapToSpots(filteredSpots);
}

function fitMapToSpots(filteredSpots) {
  if (!filteredSpots.length) {
    return;
  }

  if (filteredSpots.length === 1) {
    map.setView([filteredSpots[0].lat, filteredSpots[0].lng], 14);
    return;
  }

  const bounds = L.latLngBounds(filteredSpots.map((spot) => [spot.lat, spot.lng]));
  map.fitBounds(bounds, { padding: [40, 40] });
}

function renderPlacesList() {
  const filteredSpots = getFilteredSpots();
  placesList.innerHTML = "";
  resultsCount.textContent = filteredSpots.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "Choose country and city to see places.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!filteredSpots.length) {
    emptyPlacesMessage.textContent = "No places found.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  filteredSpots.forEach((spot) => {
    const card = document.createElement("div");
    card.className = "place-item";

    card.innerHTML = `
      <img src="${spot.image}" alt="${escapeHtml(spot.name)}">
      <div class="place-item-content">
        <h3>${escapeHtml(spot.name)}</h3>
        <div class="place-meta">${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</div>
        <div class="place-desc">${escapeHtml(spot.description)}</div>
        <div class="place-actions">
          <button class="focus-btn" data-id="${spot.id}">Show on Map</button>
          <button class="route-btn" data-id="${spot.id}">Route</button>
        </div>
      </div>
    `;

    placesList.appendChild(card);
  });

  document.querySelectorAll(".focus-btn").forEach((button) => {
    button.addEventListener("click", () => {
      focusSpotOnMap(Number(button.dataset.id));
    });
  });

  document.querySelectorAll(".route-btn").forEach((button) => {
    button.addEventListener("click", () => {
      drawRouteToSpot(Number(button.dataset.id));
    });
  });
}

function focusSpotOnMap(spotId) {
  const selectedSpot = spots.find((spot) => spot.id === spotId);
  if (!selectedSpot) return;

  map.setView([selectedSpot.lat, selectedSpot.lng], 15);

  const marker = markers.find((m) => m.spotId === spotId);
  if (marker) {
    marker.openPopup();
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      activeUserLocation = { lat, lng };

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([lat, lng], {
        icon: createUserIcon()
      }).addTo(map);

      userMarker.bindPopup("<strong>Your location</strong>").openPopup();

      map.setView([lat, lng], 13);
      locationStatus.textContent = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    },
    () => {
      alert("Could not get your location.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function drawRouteToSpot(spotId) {
  const selectedSpot = spots.find((spot) => spot.id === spotId);

  if (!selectedSpot) return;

  if (!activeUserLocation) {
    alert("First click 'Use My Location'.");
    return;
  }

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  const from = [activeUserLocation.lat, activeUserLocation.lng];
  const to = [selectedSpot.lat, selectedSpot.lng];

  routeLine = L.polyline([from, to], {
    color: "#2563eb",
    weight: 4,
    opacity: 0.85,
    dashArray: "10, 8"
  }).addTo(map);

  const bounds = L.latLngBounds([from, to]);
  map.fitBounds(bounds, { padding: [50, 50] });

  const distanceKm = calculateDistanceKm(
    activeUserLocation.lat,
    activeUserLocation.lng,
    selectedSpot.lat,
    selectedSpot.lng
  );

  const travelMode = travelModeSelect.value;
  const speedKmH = travelMode === "WALKING" ? 5 : 40;
  const durationHours = distanceKm / speedKmH;
  const durationMinutes = Math.round(durationHours * 60);

  routeInfo.textContent =
    `Route to ${selectedSpot.name}: ${distanceKm.toFixed(1)} km • approx. ${durationMinutes} min by ${travelMode.toLowerCase()}.`;
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function renderAll() {
  renderPlacesList();
  renderMarkers();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

countrySelect.addEventListener("change", (event) => {
  selectedCountry = event.target.value;
  selectedCity = "";
  citySelect.value = "";
  populateCities(selectedCountry);
  renderAll();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  renderAll();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderAll();
});

resetFiltersBtn.addEventListener("click", () => {
  selectedCountry = "";
  selectedCity = "";
  searchTerm = "";

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">Select city</option>';
  citySelect.disabled = true;
  searchInput.value = "";
  resultsCount.textContent = "0";
  emptyPlacesMessage.textContent = "Choose country and city to see places.";
  emptyPlacesMessage.style.display = "block";

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  clearMarkers();
  placesList.innerHTML = "";
  routeInfo.textContent = "No route yet.";
  map.setView([20, 0], 2);
});

useMyLocationBtn.addEventListener("click", useMyLocation);

initMap();
populateCountries();
renderAll();
