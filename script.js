const spots = [
  {
    id: 1,
    name: "Hidden Beach Corner",
    city: "Tel Aviv",
    description: "A quiet beach spot perfect for sunset and peaceful time away from crowds.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 2,
    name: "Secret Rooftop View",
    city: "Tel Aviv",
    description: "An amazing rooftop with a city view that feels like a hidden local treasure.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 3,
    name: "Quiet Garden Café",
    city: "Tel Aviv",
    description: "A beautiful café surrounded by plants, ideal for reading or relaxed meetings.",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 4,
    name: "Old Stone Alley",
    city: "Jaffa",
    description: "A charming alley with historic vibes, perfect for photos and slow walks.",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 5,
    name: "Sunrise Viewpoint",
    city: "Haifa",
    description: "A hidden viewpoint where early mornings feel magical and calm.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 6,
    name: "Forest Path Escape",
    city: "Jerusalem",
    description: "A peaceful walking path for people who want nature inside the city.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
  }
];

const spotsContainer = document.getElementById("spotsContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesSection = document.getElementById("favoritesSection");
const spotsSection = document.getElementById("spotsSection");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const backToSpotsBtn = document.getElementById("backToSpotsBtn");
const emptyFavoritesMessage = document.getElementById("emptyFavoritesMessage");

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
      ${
        favoriteView
          ? `<button class="remove-btn" data-id="${spot.id}">Remove</button>`
          : isFavorite(spot.id)
            ? `<button class="remove-btn" data-id="${spot.id}">Remove from Favorites</button>`
            : `<button class="save-btn" data-id="${spot.id}">Save to Favorites</button>`
      }
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
