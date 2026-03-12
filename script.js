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

const globeSection = document.getElementById("globeSection");
const mapSection = document.getElementById("mapSection");
const showGlobeBtn = document.getElementById("showGlobeBtn");
const showMapBtn = document.getElementById("showMapBtn");

let selectedCountry = "";
let selectedCity = "";
let searchTerm = "";

let globe;
let map;
let mapMarkers = [];
let activeSpotId = null;

function initGlobe() {
  globe = Globe()(globeSection)
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
  const sidebarWidth = window.innerWidth > 960 ? 380 : 0;
  globe.width(window.innerWidth - sidebarWidth);
  globe.height(window.innerWidth > 960 ? window.innerHeight : window.innerHeight * 0.72);
}

function initMap() {
  map = L.map("mapSection").setView([31.7683, 35.2137], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function createMapPinIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="custom-pin"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24]
  });
}

function createPinElement(place) {
  const wrapper = document.createElement("div");
  wrapper.className = "pin";
  wrapper.innerHTML = `
    <div class="pin-label">${escapeHtml(place.nameHe)}</div>
    <div class="pin-shape"></div>
    <div class="pin-inner"></div>
  `;

  wrapper.style.cursor = "pointer";

  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    openPlace(place.id);
  });

  return wrapper;
}

function populateCountries() {
  const countries = [...new Set(placesData.map(place => place.country))].sort();

  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

function populateCities(country) {
  citySelect.innerHTML = '<option value="">בחר עיר</option>';

  if (!country) {
    citySelect.disabled = true;
    return;
  }

  let cities = [];

  if (country === "ישראל") {
    cities = israelCities;
  } else if (country === "ארצות הברית") {
    cities = usCitiesSample;
  } else {
    cities = [...new Set(
      placesData
        .filter(place => place.country === country)
        .map(place => place.city)
    )].sort();
  }

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

function getFilteredPlaces() {
  return placesData.filter(place => {
    const countryMatch = selectedCountry ? place.country === selectedCountry : true;
    const cityMatch = selectedCity ? place.city === selectedCity : true;
    const textMatch = searchTerm
      ? `${place.nameHe} ${place.city} ${place.country} ${place.descriptionHe}`.includes(searchTerm)
      : true;

    return countryMatch && cityMatch && textMatch;
  });
}

function getSearchTarget() {
  const exactPlace = placesData.find(place =>
    place.nameHe.includes(searchTerm) ||
    place.city.includes(searchTerm) ||
    place.country.includes(searchTerm)
  );

  return exactPlace || null;
}

function renderGlobeMarkers() {
  const places = selectedCountry && selectedCity ? getFilteredPlaces() : [];
  globe.htmlElementsData(places);
}

function clearMapMarkers() {
  mapMarkers.forEach(marker => map.removeLayer(marker));
  mapMarkers = [];
}

function renderMapMarkers() {
  clearMapMarkers();

  const places = selectedCountry && selectedCity ? getFilteredPlaces() : [];

  places.forEach(place => {
    const marker = L.marker([place.lat, place.lng], {
      icon: createMapPinIcon()
    }).addTo(map);

    marker.bindPopup(`
      <div style="min-width:200px; direction: rtl; text-align: right;">
        <strong>${escapeHtml(place.nameHe)}</strong><br>
        ${escapeHtml(place.city)}, ${escapeHtml(place.country)}
      </div>
    `);

    marker.placeId = place.id;
    marker.on("click", () => {
      openOverlay(place);
    });

    mapMarkers.push(marker);
  });

  if (places.length === 1) {
    map.setView([places[0].lat, places[0].lng], 14);
  } else if (places.length > 1) {
    const bounds = L.latLngBounds(places.map(place => [place.lat, place.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function renderPlacesList() {
  const places = getFilteredPlaces();
  placesList.innerHTML = "";
  resultsCount.textContent = places.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "בחר מדינה ועיר כדי לראות מקומות.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!places.length) {
    emptyPlacesMessage.textContent = "לא נמצאו מקומות.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  places.forEach(place => {
    const card = document.createElement("div");
    card.className = "place-item";

    card.innerHTML = `
      <div class="place-item-content">
        <div class="place-tag ${place.category}">
          ${place.category === "popular" ? "פופולרי" : "מומלץ"}
        </div>
        <h3>${escapeHtml(place.nameHe)}</h3>
        <div class="place-meta">${escapeHtml(place.city)}, ${escapeHtml(place.country)}</div>
        <div class="place-desc">${escapeHtml(place.descriptionHe)}</div>
        <div class="place-actions">
          <a class="source-btn" href="${place.sourceUrl}" target="_blank" rel="noopener noreferrer">מקור</a>
          <button class="focus-btn" data-id="${place.id}">הצג</button>
        </div>
      </div>
    `;

    placesList.appendChild(card);
  });

  document.querySelectorAll(".focus-btn").forEach(button => {
    button.addEventListener("click", () => {
      openPlace(Number(button.dataset.id));
    });
  });
}

function openPlace(placeId) {
  const place = placesData.find(item => item.id === placeId);
  if (!place) return;

  activeSpotId = placeId;
  openOverlay(place);

  setGlobeView();
  globe.pointOfView(
    { lat: place.lat, lng: place.lng, altitude: 0.7 },
    1400
  );

  setTimeout(() => {
    setMapView();
    map.setView([place.lat, place.lng], 15);

    const marker = mapMarkers.find(m => m.placeId === place.id);
    if (marker) {
      marker.openPopup();
    }
  }, 1500);
}

function openOverlay(place) {
  overlayBadge.textContent = place.category === "popular" ? "פופולרי" : "מומלץ";
  overlayBadge.className = `overlay-badge ${place.category}`;
  overlayTitle.textContent = place.nameHe;
  overlayMeta.textContent = `${place.city}, ${place.country}`;
  overlayDescription.textContent = place.descriptionHe;
  overlaySourceBtn.href = place.sourceUrl;
  placeOverlay.classList.remove("hidden");
}

function closeOverlay() {
  placeOverlay.classList.add("hidden");
}

function setGlobeView() {
  globeSection.classList.remove("hidden");
  mapSection.classList.add("hidden");
  showGlobeBtn.classList.add("active");
  showMapBtn.classList.remove("active");
}

function setMapView() {
  globeSection.classList.add("hidden");
  mapSection.classList.remove("hidden");
  showGlobeBtn.classList.remove("active");
  showMapBtn.classList.add("active");
  setTimeout(() => map.invalidateSize(), 150);
}

function renderAll() {
  renderPlacesList();
  renderGlobeMarkers();
  renderMapMarkers();
}

function runSearch() {
  const target = getSearchTarget();
  if (!target) return;

  selectedCountry = target.country;
  selectedCity = target.city;

  countrySelect.value = selectedCountry;
  populateCities(selectedCountry);
  citySelect.value = selectedCity;

  renderAll();
  openPlace(target.id);
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  searchTerm = "";
  activeSpotId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">בחר עיר</option>';
  citySelect.disabled = true;
  searchInput.value = "";

  renderAll();
  closeOverlay();
  setGlobeView();
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1200);
  map.setView([31.7683, 35.2137], 3);
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
  renderAll();
  closeOverlay();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  renderAll();
  closeOverlay();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

resetFiltersBtn.addEventListener("click", resetAll);
closeOverlayBtn.addEventListener("click", closeOverlay);

showGlobeBtn.addEventListener("click", setGlobeView);
showMapBtn.addEventListener("click", setMapView);

populateCountries();
initGlobe();
initMap();
renderAll();
