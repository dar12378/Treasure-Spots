const spots = [
  {
    id: 1,
    name: "Hidden Beach Corner",
    city: "Tel Aviv",
    description: "A quiet beach spot perfect for sunset and peaceful time away from crowds.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    lat: 32.0853,
    lng: 34.7818
  },
  {
    id: 2,
    name: "Secret Rooftop View",
    city: "Tel Aviv",
    description: "An amazing rooftop with a city view that feels like a hidden local treasure.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    lat: 32.0809,
    lng: 34.7806
  },
  {
    id: 3,
    name: "Quiet Garden Café",
    city: "Tel Aviv",
    description: "A beautiful café surrounded by plants, ideal for reading or relaxed meetings.",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
    lat: 32.0740,
    lng: 34.7922
  },
  {
    id: 4,
    name: "Old Stone Alley",
    city: "Jaffa",
    description: "A charming alley with historic vibes, perfect for photos and slow walks.",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
    lat: 32.0500,
    lng: 34.7522
  },
  {
    id: 5,
    name: "Sunrise Viewpoint",
    city: "Haifa",
    description: "A hidden viewpoint where early mornings feel magical and calm.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    lat: 32.7940,
    lng: 34.9896
  },
  {
    id: 6,
    name: "Forest Path Escape",
    city: "Jerusalem",
    description: "A peaceful walking path for people who want nature inside the city.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    lat: 31.7683,
    lng: 35.2137
  }
];

const spotsContainer = document.getElementById("spotsContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesSection = document.getElementById("favoritesSection");
const spotsSection = document.getElementById("spotsSection");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const backToSpotsBtn = document.getElementById("backToSpotsBtn");
const emptyFavoritesMessage = document.getElementById("emptyFavoritesMessage");
const mapSection = document.getElementById("mapSection");

let map;
let markers = [];

function initMap() {
  map = L.map("map").setView([32.0853, 34.7818], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  renderMapMarkers();
}

function renderMapMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  spots.forEach((spot) => {
    const marker = L.marker([spot.lat, spot.lng]).addTo(map);

    marker.bindPopup(`
      <div style="min-width: 180px;">
        <strong>${spot.name}</strong><br>
        <span>${spot.city}</span><br><br>
        <small>${spot.description}</small>
      </div>
    `);

    markers.push(marker);
  });
}

function focusSpotOnMap(spotId) {
  const selectedSpot = spots.find((spot) => spot.id === spotId);
  if (!selectedSpot || !map) return;

  map.setView([selectedSpot.lat, selectedSpot.lng], 13, {
    animate: true
  });

  markers.forEach((marker) => {
    const position = marker.getLatLng();
    if (
      position.lat === selectedSpot.lat &&
      position.lng === selectedSpot.lng
    ) {
      marker.openPopup();
    }
  });

  mapSection.scrollIntoView({ behavior: "smooth" });
}

function getFavorites() {
  return JSON.parse(localStorage.getItem("favoriteSpots")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favoriteSpots", JSON.stringify(favorites));
}

function isFavorite(spotId) {
  const favorites = getFavorites();
  return favorites.some((spot) => spot.id === spotId);
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
  let favorites = getFavorites();
  favorites = favorites.filter((spot) => spot.id !== spotId);
  saveFavorites(favorites);
  renderSpots();
  renderFavorites();
}

function createSpotCard(spot, favoriteView = false) {
  const card = document.createElement("div");
  card.className = "spot-card";

  card.innerHTML = `
    <img class="spot-image" src="${spot.image}" alt="${spot.name}">
    <div class="spot-content">
      <h3 class="spot-title">${spot.name}</h3>
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
  spotsContainer.innerHTML = "";

  spots.forEach((spot) => {
    const card = createSpotCard(spot, false);
    spotsContainer.appendChild(card);
  });

  addCardButtonEvents();
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesContainer.innerHTML = "";

  if (favorites.length === 0) {
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
      const spotId = Number(button.dataset.id);
      addToFavorites(spotId);
    });
  });

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const spotId = Number(button.dataset.id);
      removeFromFavorites(spotId);
    });
  });

  document.querySelectorAll(".view-map-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const spotId = Number(button.dataset.id);
      focusSpotOnMap(spotId);
    });
  });
}

showFavoritesBtn.addEventListener("click", () => {
  spotsSection.classList.add("hidden");
  favoritesSection.classList.remove("hidden");
  renderFavorites();
});

backToSpotsBtn.addEventListener("click", () => {
  favoritesSection.classList.add("hidden");
  spotsSection.classList.remove("hidden");
});

renderSpots();
renderFavorites();
initMap();
