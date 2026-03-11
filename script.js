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
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const placesList = document.getElementById("placesList");
const resultsCount = document.getElementById("resultsCount");
const emptyPlacesMessage = document.getElementById("emptyPlacesMessage");

let selectedCountry = "";
let selectedCity = "";
let globe;
let currentMarkers = [];

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

  window.addEventListener("resize", () => {
    globe.width(window.innerWidth - (window.innerWidth > 960 ? 380 : 0));
    globe.height(window.innerWidth > 960 ? window.innerHeight : window.innerHeight * 0.7);
  });

  globe.width(window.innerWidth - (window.innerWidth > 960 ? 380 : 0));
  globe.height(window.innerWidth > 960 ? window.innerHeight : window.innerHeight * 0.7);
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
  if (!selectedCountry || !selectedCity) return [];

  return spots.filter(spot =>
    spot.country === selectedCountry && spot.city === selectedCity
  );
}

function renderPlacesList() {
  const filteredSpots = getFilteredSpots();
  placesList.innerHTML = "";
  resultsCount.textContent = filteredSpots.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "Choose country and city to show places.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!filteredSpots.length) {
    emptyPlacesMessage.textContent = "No places found for this city.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  filteredSpots.forEach(spot => {
    const card = document.createElement("div");
    card.className = "place-item";

    card.innerHTML = `
      <img src="${spot.image}" alt="${escapeHtml(spot.name)}">
      <div class="place-item-content">
        <h3>${escapeHtml(spot.name)}</h3>
        <div class="place-meta">${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</div>
        <div class="place-desc">${escapeHtml(spot.description)}</div>
        <button class="focus-btn" data-id="${spot.id}">Show on Globe</button>
      </div>
    `;

    placesList.appendChild(card);
  });

  document.querySelectorAll(".focus-btn").forEach(button => {
    button.addEventListener("click", () => {
      focusSpot(Number(button.dataset.id));
    });
  });
}

function renderMarkers() {
  currentMarkers = getFilteredSpots();
  globe.htmlElementsData(currentMarkers);
}

function focusSpot(spotId) {
  const spot = spots.find(item => item.id === spotId);
  if (!spot) return;

  globe.pointOfView(
    { lat: spot.lat, lng: spot.lng, altitude: 0.7 },
    1400
  );
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">Select city</option>';
  citySelect.disabled = true;

  renderPlacesList();
  renderMarkers();

  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1200);
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
  populateCities(selectedCountry);
  citySelect.value = "";
  renderPlacesList();
  renderMarkers();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  renderPlacesList();
  renderMarkers();
});

resetFiltersBtn.addEventListener("click", resetAll);

populateCountries();
initGlobe();
renderPlacesList();
renderMarkers();
