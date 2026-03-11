const spots = [
  {
    id: 1,
    name: "Hidden Beach Corner",
    country: "Israel",
    city: "Tel Aviv",
    description: "A quiet beach spot perfect for sunset and peaceful time away from crowds.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    lat: 32.0853,
    lng: 34.7818
  },
  {
    id: 2,
    name: "Secret Rooftop View",
    country: "Israel",
    city: "Tel Aviv",
    description: "An amazing rooftop with a city view that feels like a hidden local treasure.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    lat: 32.0809,
    lng: 34.7806
  },
  {
    id: 3,
    name: "Old Stone Alley",
    country: "Israel",
    city: "Jaffa",
    description: "A charming alley with historic vibes, perfect for photos and slow walks.",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
    lat: 32.0500,
    lng: 34.7522
  },
  {
    id: 4,
    name: "Forest Path Escape",
    country: "Israel",
    city: "Jerusalem",
    description: "A peaceful walking path for people who want nature inside the city.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    lat: 31.7683,
    lng: 35.2137
  },
  {
    id: 5,
    name: "Sunrise Viewpoint",
    country: "France",
    city: "Paris",
    description: "A special sunrise view with a quiet atmosphere before the city wakes up.",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80",
    lat: 48.8566,
    lng: 2.3522
  },
  {
    id: 6,
    name: "Hidden Garden Walk",
    country: "France",
    city: "Paris",
    description: "A peaceful walking route hidden between beautiful old streets.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    lat: 48.8606,
    lng: 2.3376
  },
  {
    id: 7,
    name: "Canal Escape Spot",
    country: "Netherlands",
    city: "Amsterdam",
    description: "A calm canal-side place ideal for photos and quiet evening moments.",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=80",
    lat: 52.3676,
    lng: 4.9041
  },
  {
    id: 8,
    name: "Cozy Art Corner",
    country: "Netherlands",
    city: "Amsterdam",
    description: "A small hidden art street with charm, color, and a local feel.",
    image: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=900&q=80",
    lat: 52.3702,
    lng: 4.8952
  }
];

const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const spotsContainer = document.getElementById("spotsContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesSection = document.getElementById("favoritesSection");
const spotsSection = document.getElementById("spotsSection");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const backToSpotsBtn = document.getElementById("backToSpotsBtn");
const emptyFavoritesMessage = document.getElementById("emptyFavoritesMessage");
const noResultsMessage = document.getElementById("noResultsMessage");
const mapSection = document.getElementById("mapSection");

let map;
let markers = [];
let selectedCountry = "";
let selectedCity = "";

function getFavorites() {
  return JSON.parse(localStorage.getItem("favoriteSpots")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favoriteSpots", JSON.stringify(favorites));
}

function isFavorite(spotId) {
  return getFavorites().some((spot) => spot.id === spotId);
}

function addToFavorites(spotId) {
  const favorites = getFavorites();
  const selectedSpot = spots.find((spot) => spot.id === spotId);

  if (!selectedSpot) return;

  if (!favorites.some((spot) => spot.id === spotId)) {
    favorites.push(selectedSpot);
    saveFavorites(favorites);
    renderSpots();
    renderFavorites();
  }
}

function removeFromFavorites(spotId) {
  const updatedFavorites = getFavorites().filter((spot) => spot.id !== spotId);
  saveFavorites(updatedFavorites);
  renderSpots();
  renderFavorites();
}

function getFilteredSpots() {
  return spots.filter((spot) => {
    const matchesCountry = selectedCountry ? spot.country === selectedCountry : true;
    const matchesCity = selectedCity ? spot.city === selectedCity : true;
    return matchesCountry && matchesCity;
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

function createCustomIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="custom-pin"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24]
  });
}

function initMap() {
  map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  renderMapMarkers();
}

function clearMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
}

function renderMapMarkers() {
  clearMarkers();

  const filteredSpots = getFilteredSpots();

  filteredSpots.forEach((spot) => {
    const marker = L.marker([spot.lat, spot.lng], {
      icon: createCustomIcon()
    }).addTo(map);

    marker.bindPopup(`
      <div style="min-width: 190px;">
        <strong>${spot.name}</strong><br>
        <span>${spot.city}, ${spot.country}</span><br><br>
        <small>${spot.description}</small>
      </div>
    `);

    markers.push(marker);
  });

  fitMapToFilteredSpots(filteredSpots);
}

function fitMapToFilteredSpots(filteredSpots) {
  if (!filteredSpots.length) {
    map.setView([20, 0], 2);
    return;
  }

  if (filteredSpots.length === 1) {
    map.setView([filteredSpots[0].lat, filteredSpots[0].lng], 13);
    return;
  }

  const bounds = L.latLngBounds(
    filteredSpots.map((spot) => [spot.lat, spot.lng])
  );

  map.fitBounds(bounds, { padding: [40, 40] });
}

function focusSpotOnMap(spotId) {
  const selectedSpotObject = spots.find((spot) => spot.id === spotId);
  if (!selectedSpotObject || !map) return;

  map.setView([selectedSpotObject.lat, selectedSpotObject.lng], 14, {
    animate: true
  });

  markers.forEach((marker) => {
    const position = marker.getLatLng();
    if (position.lat === selectedSpotObject.lat && position.lng === selectedSpotObject.lng) {
      marker.openPopup();
    }
  });

  mapSection.scrollIntoView({ behavior: "smooth" });
}

function createSpotCard(spot, favoriteView = false) {
  const card = document.createElement("div");
  card.className = "spot-card";

  card.innerHTML = `
    <img class="spot-image" src="${spot.image}" alt="${spot.name}">
    <div class="spot-content">
      <h3 class="spot-title">${spot.name}</h3>
      <p class="spot-country">${spot.country}</p>
      <p class="spot-city">${spot.city}</p>
      <p class="spot-description">${spot.description}</p>

      <div class="card-actions">
        <button class="view-map-btn" data-id="${spot.id}">View on Map</button>
        ${
          favoriteView
            ? `<button class="remove-btn" data-id="${spot.id}">Remove</button>`
            : isFavorite(spot.id)
              ? `<button class="remove-btn" data-id="${spot.id}">Remove from Favorites</button>`
              : `<button class="save-btn" data-id="${spot.id}">Save to Favorites</button>`
        }
      </div>
    </div>
  `;

  return card;
}

function renderSpots() {
  const filteredSpots = getFilteredSpots();
  spotsContainer.innerHTML = "";

  if (!filteredSpots.length) {
    noResultsMessage.classList.remove("hidden");
  } else {
    noResultsMessage.classList.add("hidden");

    filteredSpots.forEach((spot) => {
      const card = createSpotCard(spot, false);
      spotsContainer.appendChild(card);
    });
  }

  addCardButtonEvents();
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesContainer.innerHTML = "";

  if (!favorites.length) {
    emptyFavoritesMessage.classList.remove("hidden");
  } else {
    emptyFavoritesMessage.classList.add("hidden");

    favorites.forEach((spot) => {
      const card = createSpotCard(spot, true);
      favoritesContainer.appendChild(card);
    });
  }

  addCardButtonEvents();
}

function addCardButtonEvents() {
  document.querySelectorAll(".save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      addToFavorites(Number(button.dataset.id));
    });
  });

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromFavorites(Number(button.dataset.id));
    });
  });

  document.querySelectorAll(".view-map-btn").forEach((button) => {
    button.addEventListener("click", () => {
      focusSpotOnMap(Number(button.dataset.id));
    });
  });
}

countrySelect.addEventListener("change", (event) => {
  selectedCountry = event.target.value;
  selectedCity = "";
  populateCities(selectedCountry);
  citySelect.value = "";
  renderSpots();
  renderMapMarkers();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  renderSpots();
  renderMapMarkers();
});

resetFiltersBtn.addEventListener("click", () => {
  selectedCountry = "";
  selectedCity = "";
  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">Select city</option>';
  citySelect.disabled = true;
  renderSpots();
  renderMapMarkers();
});

showFavoritesBtn.addEventListener("click", () => {
  spotsSection.classList.add("hidden");
  favoritesSection.classList.remove("hidden");
  renderFavorites();
});

backToSpotsBtn.addEventListener("click", () => {
  favoritesSection.classList.add("hidden");
  spotsSection.classList.remove("hidden");
});

populateCountries();
renderSpots();
renderFavorites();
initMap();
