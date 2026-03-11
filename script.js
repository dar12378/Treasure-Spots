const spots = [
  {
    id: 1,
    name: "NDSM Wharf",
    country: "Netherlands",
    city: "Amsterdam",
    category: "recommended",
    description: "A former shipyard turned creative waterfront area with art spaces, festivals and bars.",
    lat: 52.4003,
    lng: 4.8947,
    sourceName: "I amsterdam",
    sourceUrl: "https://www.iamsterdam.com/en/explore/neighbourhoods/ndsm"
  },
  {
    id: 2,
    name: "Hortus Botanicus Amsterdam",
    country: "Netherlands",
    city: "Amsterdam",
    category: "popular",
    description: "One of the oldest botanical gardens in the world and a calm oasis in the city.",
    lat: 52.3661,
    lng: 4.9086,
    sourceName: "I amsterdam",
    sourceUrl: "https://www.iamsterdam.com/en/whats-on/calendar/museums-and-galleries/museums/hortus-botanicus-amsterdam-botanical-garden"
  },
  {
    id: 3,
    name: "Canal Saint-Martin",
    country: "France",
    city: "Paris",
    category: "recommended",
    description: "A lively canal area with waterside walks, local hangouts and a more neighborhood feel.",
    lat: 48.8722,
    lng: 2.3638,
    sourceName: "Paris je t'aime",
    sourceUrl: "https://parisjetaime.com/eng/article/cosmopolitan-paris-a920"
  },
  {
    id: 4,
    name: "Parc des Buttes-Chaumont",
    country: "France",
    city: "Paris",
    category: "popular",
    description: "A dramatic hilltop park with a lake, waterfall, suspension bridge and big city views.",
    lat: 48.8809,
    lng: 2.3819,
    sourceName: "Paris je t'aime",
    sourceUrl: "https://parisjetaime.com/eng/article/beautiful-gardens-woods-paris-region-a1091"
  },
  {
    id: 5,
    name: "Leake Street Arches",
    country: "United Kingdom",
    city: "London",
    category: "recommended",
    description: "A street-art tunnel and event space under Waterloo with changing murals and nightlife.",
    lat: 51.5010,
    lng: -0.1132,
    sourceName: "Visit London",
    sourceUrl: "https://www.visitlondon.com/things-to-do/place/46224204-leake-street-arches"
  },
  {
    id: 6,
    name: "Barbican Conservatory",
    country: "United Kingdom",
    city: "London",
    category: "popular",
    description: "A tropical conservatory hidden inside the Barbican complex.",
    lat: 51.5202,
    lng: -0.0953,
    sourceName: "Barbican",
    sourceUrl: "https://www.barbican.org.uk/whats-on/2026/event/visit-the-conservatory"
  },
  {
    id: 7,
    name: "Kiyosumi Gardens",
    country: "Japan",
    city: "Tokyo",
    category: "popular",
    description: "A traditional strolling garden with pond views, stepping stones and a quiet atmosphere.",
    lat: 35.6797,
    lng: 139.8008,
    sourceName: "GO TOKYO",
    sourceUrl: "https://www.gotokyo.org/en/spot/25/index.html"
  },
  {
    id: 8,
    name: "Yanaka Ginza",
    country: "Japan",
    city: "Tokyo",
    category: "recommended",
    description: "A nostalgic shopping street that still feels local and community-oriented.",
    lat: 35.7279,
    lng: 139.7668,
    sourceName: "GO TOKYO",
    sourceUrl: "https://www.gotokyo.org/en/spot/170/index.html"
  },
  {
    id: 9,
    name: "Bunkers del Carmel",
    country: "Spain",
    city: "Barcelona",
    category: "popular",
    description: "A hilltop 360-degree viewpoint over Barcelona.",
    lat: 41.4187,
    lng: 2.1527,
    sourceName: "Bunkers.cat",
    sourceUrl: "https://www.bunkers.cat/en/"
  },
  {
    id: 10,
    name: "LX Factory",
    country: "Portugal",
    city: "Lisbon",
    category: "recommended",
    description: "A creative industrial complex with shops, cafes, bars and events.",
    lat: 38.7037,
    lng: -9.1784,
    sourceName: "LX Factory",
    sourceUrl: "https://lxfactory.com/en/homepage-en/"
  },
  {
    id: 11,
    name: "Brooklyn Bridge",
    country: "United States",
    city: "New York City",
    category: "popular",
    description: "An iconic walk with skyline views and one of the classic New York experiences.",
    lat: 40.7061,
    lng: -73.9969,
    sourceName: "NYC Tourism",
    sourceUrl: "https://www.nycgo.com/attractions/brooklyn-bridge"
  },
  {
    id: 12,
    name: "Little Island",
    country: "United States",
    city: "New York City",
    category: "recommended",
    description: "A newer public park on the Hudson with gardens, views and performance spaces.",
    lat: 40.7420,
    lng: -74.0108,
    sourceName: "NYC Tourism",
    sourceUrl: "https://business.nycgo.com/press-and-media/press-releases/articles/post/nyc-company-presents-summer-update-22-reasons-to-visit-new-york-city-in-2022/?guid=725d2e24-60a7-4638-8ba8-5ce1421096d3&preview=true"
  }
];

const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const searchInput = document.getElementById("searchInput");

const placesList = document.getElementById("placesList");
const resultsCount = document.getElementById("resultsCount");
const emptyPlacesMessage = document.getElementById("emptyPlacesMessage");

const placeOverlay = document.getElementById("placeOverlay");
const closeOverlayBtn = document.getElementById("closeOverlayBtn");
const overlayBadge = document.getElementById("overlayBadge");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMeta = document.getElementById("overlayMeta");
const overlayDescription = document.getElementById("overlayDescription");
const overlaySourceBtn = document.getElementById("overlaySourceBtn");
const overlayFocusBtn = document.getElementById("overlayFocusBtn");

let selectedCountry = "";
let selectedCity = "";
let searchTerm = "";

let globe;
let activeSpotId = null;

function initGlobe() {
  globe = Globe()(document.getElementById("globeViz"))
    .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
    .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
    .showAtmosphere(true)
    .atmosphereColor("#4da3ff")
    .atmosphereAltitude(0.18)
    .htmlElementsData([])
    .htmlLat(d => d.lat)
    .htmlLng(d => d.lng)
    .htmlElement(d => createPinElement(d));

  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

  resizeGlobe();
  window.addEventListener("resize", resizeGlobe);
}

function resizeGlobe() {
  const sidebarWidth = window.innerWidth > 960 ? 390 : 0;
  globe.width(window.innerWidth - sidebarWidth);
  globe.height(window.innerWidth > 960 ? window.innerHeight : window.innerHeight * 0.72);
}

function createPinElement(spot) {
  const wrapper = document.createElement("div");
  wrapper.className = "pin";
  wrapper.innerHTML = `
    <div class="pin-label">${escapeHtml(spot.name)}</div>
    <div class="pin-shape"></div>
    <div class="pin-inner"></div>
  `;

  wrapper.style.cursor = "pointer";

  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    openSpotOverlay(spot.id);
    focusSpot(spot.id);
  });

  return wrapper;
}

function populateCountries() {
  const countries = [...new Set(spots.map(spot => spot.country))].sort();

  countries.forEach(country => {
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
      .filter(spot => spot.country === country)
      .map(spot => spot.city)
  )].sort();

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

function getFilteredSpots() {
  return spots.filter(spot => {
    const countryMatch = selectedCountry ? spot.country === selectedCountry : true;
    const cityMatch = selectedCity ? spot.city === selectedCity : true;
    const textMatch = searchTerm
      ? `${spot.name} ${spot.city} ${spot.country} ${spot.description}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return countryMatch && cityMatch && textMatch;
  });
}

function getVisibleMarkersSpots() {
  if (!selectedCountry || !selectedCity) {
    return [];
  }
  return getFilteredSpots();
}

function renderMarkers() {
  globe.htmlElementsData(getVisibleMarkersSpots());
}

function renderPlacesList() {
  const filteredSpots = getFilteredSpots();
  placesList.innerHTML = "";
  resultsCount.textContent = filteredSpots.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "Choose a country and city to show places.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!filteredSpots.length) {
    emptyPlacesMessage.textContent = "No places found for this search.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  filteredSpots.forEach(spot => {
    const card = document.createElement("div");
    card.className = "place-item";

    card.innerHTML = `
      <div class="place-item-content">
        <div class="place-tag ${spot.category}">${escapeHtml(spot.category)}</div>
        <h3>${escapeHtml(spot.name)}</h3>
        <div class="place-meta">${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</div>
        <div class="place-desc">${escapeHtml(spot.description)}</div>
        <div class="place-actions">
          <a class="source-btn" href="${spot.sourceUrl}" target="_blank" rel="noopener noreferrer">Source</a>
          <button class="focus-btn" data-id="${spot.id}">Show on Globe</button>
        </div>
      </div>
    `;

    placesList.appendChild(card);
  });

  document.querySelectorAll(".focus-btn").forEach(button => {
    button.addEventListener("click", () => {
      const spotId = Number(button.dataset.id);
      openSpotOverlay(spotId);
      focusSpot(spotId);
    });
  });
}

function focusSpot(spotId) {
  const spot = spots.find(item => item.id === spotId);
  if (!spot) return;

  activeSpotId = spotId;

  globe.pointOfView(
    { lat: spot.lat, lng: spot.lng, altitude: 0.65 },
    1400
  );
}

function openSpotOverlay(spotId) {
  const spot = spots.find(item => item.id === spotId);
  if (!spot) return;

  activeSpotId = spotId;

  overlayBadge.textContent = spot.category;
  overlayBadge.className = `overlay-badge ${spot.category}`;
  overlayTitle.textContent = spot.name;
  overlayMeta.textContent = `${spot.city}, ${spot.country}`;
  overlayDescription.textContent = spot.description;
  overlaySourceBtn.href = spot.sourceUrl;

  placeOverlay.classList.remove("hidden");
}

function closeSpotOverlay() {
  placeOverlay.classList.add("hidden");
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  searchTerm = "";
  activeSpotId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">Select city</option>';
  citySelect.disabled = true;
  searchInput.value = "";

  renderPlacesList();
  renderMarkers();
  closeSpotOverlay();

  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1200);
}

function renderAll() {
  renderPlacesList();
  renderMarkers();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => {
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
  closeSpotOverlay();
  renderAll();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  closeSpotOverlay();
  renderAll();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  closeSpotOverlay();
  renderAll();
});

resetFiltersBtn.addEventListener("click", resetAll);

closeOverlayBtn.addEventListener("click", closeSpotOverlay);

overlayFocusBtn.addEventListener("click", () => {
  if (activeSpotId) {
    focusSpot(activeSpotId);
  }
});

populateCountries();
initGlobe();
renderAll();
