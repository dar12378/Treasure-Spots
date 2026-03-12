const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const styleSelect = document.getElementById("styleSelect");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const showGlobeBtn = document.getElementById("showGlobeBtn");
const showMapBtn = document.getElementById("showMapBtn");

const globeSection = document.getElementById("globeSection");
const mapSection = document.getElementById("mapSection");

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

const tripBudget = document.getElementById("tripBudget");
const tripDays = document.getElementById("tripDays");
const tripStyle = document.getElementById("tripStyle");
const premiumPlanBtn = document.getElementById("premiumPlanBtn");
const premiumOutput = document.getElementById("premiumOutput");

let selectedCountry = "";
let selectedCity = "";
let selectedStyle = "";
let searchTerm = "";
let activePlaceId = null;

let globe;
let map;
let mapMarkers = [];

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/["']/g, "");
}

function getLocalTime(timezone) {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
  } catch {
    return "לא ידוע";
  }
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

function populateCountries() {
  allCountries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

function populateCities(country) {
  citySelect.innerHTML = '<option value="">בחר עיר</option>';

  if (!country || !countryCities[country]) {
    citySelect.disabled = true;
    return;
  }

  countryCities[country].forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  citySelect.disabled = false;
}

function populateStyles() {
  allStyles.forEach((style) => {
    const option1 = document.createElement("option");
    option1.value = style;
    option1.textContent = style;
    styleSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = style;
    option2.textContent = style;
    tripStyle.appendChild(option2);
  });
}

function scorePlace(place) {
  let score = place.interestScore || 0;

  if (selectedStyle && place.styles.includes(selectedStyle)) {
    score += 20;
  }

  if (place.category === "popular") {
    score += 5;
  }

  return score;
}

function getFilteredPlaces() {
  return placesData
    .filter((place) => {
      const countryMatch = selectedCountry ? place.country === selectedCountry : true;
      const cityMatch = selectedCity ? place.city === selectedCity : true;
      const styleMatch = selectedStyle ? place.styles.includes(selectedStyle) : true;

      const textBlob = [
        place.nameHe,
        place.nameEn,
        place.country,
        place.city,
        ...(place.countryAliases || []),
        ...(place.cityAliases || []),
        place.descriptionHe
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = searchTerm ? textBlob.includes(searchTerm.toLowerCase()) : true;

      return countryMatch && cityMatch && styleMatch && searchMatch;
    })
    .sort((a, b) => scorePlace(b) - scorePlace(a));
}

function findBestSearchMatch(query) {
  const q = normalizeText(query);
  if (!q) return null;

  return (
    placesData.find((place) => normalizeText(place.nameHe).includes(q)) ||
    placesData.find((place) => normalizeText(place.nameEn).includes(q)) ||
    placesData.find((place) => normalizeText(place.city).includes(q)) ||
    placesData.find((place) => (place.cityAliases || []).some((alias) => normalizeText(alias).includes(q))) ||
    placesData.find((place) => (place.countryAliases || []).some((alias) => normalizeText(alias).includes(q))) ||
    null
  );
}

function initGlobe() {
  globe = Globe()(globeSection)
    .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
    .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
    .showAtmosphere(true)
    .atmosphereColor("#4da3ff")
    .atmosphereAltitude(0.18)
    .htmlElementsData([])
    .htmlLat((d) => d.lat)
    .htmlLng((d) => d.lng)
    .htmlElement((d) => createGlobePin(d));

  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
  resizeGlobe();

  window.addEventListener("resize", resizeGlobe);
}

function resizeGlobe() {
  const sidebarWidth = window.innerWidth > 960 ? 390 : 0;
  globe.width(window.innerWidth - sidebarWidth);
  globe.height(window.innerWidth > 960 ? window.innerHeight : window.innerHeight * 0.72);
}

function createGlobePin(place) {
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
    openPlace(place.id, true);
  });

  return wrapper;
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

function clearMapMarkers() {
  mapMarkers.forEach((marker) => map.removeLayer(marker));
  mapMarkers = [];
}

function renderMapMarkers() {
  clearMapMarkers();

  const visiblePlaces = selectedCountry && selectedCity ? getFilteredPlaces() : [];

  visiblePlaces.forEach((place) => {
    const marker = L.marker([place.lat, place.lng], {
      icon: createMapPinIcon()
    }).addTo(map);

    marker.placeId = place.id;

    marker.bindPopup(`
      <div style="min-width:220px; direction: rtl; text-align: right;">
        <strong>${escapeHtml(place.nameHe)}</strong><br>
        ${escapeHtml(place.city)}, ${escapeHtml(place.country)}<br>
        שעה מקומית: ${escapeHtml(getLocalTime(place.timezone))}
      </div>
    `);

    marker.on("click", () => {
      openOverlay(place);
    });

    mapMarkers.push(marker);
  });

  if (visiblePlaces.length === 1) {
    map.setView([visiblePlaces[0].lat, visiblePlaces[0].lng], 14);
  } else if (visiblePlaces.length > 1) {
    const bounds = L.latLngBounds(visiblePlaces.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function renderGlobeMarkers() {
  const visiblePlaces = selectedCountry && selectedCity ? getFilteredPlaces() : [];
  globe.htmlElementsData(visiblePlaces);
}

function renderPlacesList() {
  const places = getFilteredPlaces();
  placesList.innerHTML = "";
  resultsCount.textContent = places.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "בחר מדינה ועיר או חפש יעד.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!places.length) {
    emptyPlacesMessage.textContent = "לא נמצאו מקומות מתאימים.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  places.forEach((place) => {
    const card = document.createElement("div");
    card.className = "place-item";

    card.innerHTML = `
      <div class="place-item-content">
        <div class="place-tag ${place.category}">
          ${place.category === "popular" ? "פופולרי" : "מומלץ"}
        </div>

        <h3>${escapeHtml(place.nameHe)}</h3>

        <div class="place-meta">
          ${escapeHtml(place.city)}, ${escapeHtml(place.country)}<br>
          שעה: ${escapeHtml(getLocalTime(place.timezone))} • עניין: ${place.interestScore}/100 • טיסה: $${place.estimatedFlightUsd}
        </div>

        <div class="place-desc">${escapeHtml(place.descriptionHe)}</div>

        <div class="place-actions">
          <a class="source-btn" href="${place.sourceUrl}" target="_blank" rel="noopener noreferrer">מקור</a>
          <button class="focus-btn" data-id="${place.id}">הצג</button>
        </div>
      </div>
    `;

    placesList.appendChild(card);
  });

  document.querySelectorAll(".focus-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openPlace(Number(button.dataset.id), true);
    });
  });
}

function openOverlay(place) {
  activePlaceId = place.id;

  overlayBadge.textContent = place.category === "popular" ? "פופולרי" : "מומלץ";
  overlayBadge.className = `overlay-badge ${place.category}`;

  overlayTitle.textContent = place.nameHe;
  overlayMeta.textContent = `${place.city}, ${place.country} • שעה מקומית: ${getLocalTime(place.timezone)} • עניין: ${place.interestScore}/100 • טיסה משוערת: $${place.estimatedFlightUsd}`;
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

  setTimeout(() => {
    map.invalidateSize();
  }, 150);
}

function openPlace(placeId, autoSwitchToMap = false) {
  const place = placesData.find((item) => item.id === placeId);
  if (!place) return;

  activePlaceId = placeId;
  openOverlay(place);

  setGlobeView();

  globe.pointOfView(
    { lat: place.lat, lng: place.lng, altitude: 0.7 },
    1400
  );

  if (autoSwitchToMap) {
    setTimeout(() => {
      setMapView();
      map.setView([place.lat, place.lng], 15);

      const marker = mapMarkers.find((m) => m.placeId === place.id);
      if (marker) {
        marker.openPopup();
      }
    }, 1500);
  }
}

function renderAll() {
  renderPlacesList();
  renderGlobeMarkers();
  renderMapMarkers();
}

function runSearch() {
  searchTerm = searchInput.value.trim();
  const target = findBestSearchMatch(searchTerm);

  if (!target) {
    alert("לא נמצא יעד מתאים לחיפוש.");
    return;
  }

  selectedCountry = target.country;
  selectedCity = target.city;

  countrySelect.value = selectedCountry;
  populateCities(selectedCountry);
  citySelect.value = selectedCity;

  renderAll();
  openPlace(target.id, true);
}

function buildPremiumPlan() {
  const budget = Number(tripBudget.value || 0);
  const days = Number(tripDays.value || 0);
  const chosenStyle = tripStyle.value || selectedStyle;

  if (!selectedCountry || !selectedCity) {
    premiumOutput.textContent = "בחר קודם מדינה ועיר.";
    return;
  }

  if (!budget || !days) {
    premiumOutput.textContent = "הכנס תקציב ומספר ימים.";
    return;
  }

  const matchingPlaces = placesData
    .filter((place) => {
      return (
        place.country === selectedCountry &&
        place.city === selectedCity &&
        (chosenStyle ? place.styles.includes(chosenStyle) : true)
      );
    })
    .sort((a, b) => b.interestScore - a.interestScore)
    .slice(0, 3);

  if (!matchingPlaces.length) {
    premiumOutput.textContent = "לא נמצאו מספיק מקומות מתאימים לתוכנית.";
    return;
  }

  premiumOutput.textContent =
    `תוכנית פרימיום לדוגמה: ${days} ימים ב${selectedCity}, ${selectedCountry}. ` +
    `סגנון: ${chosenStyle || "כללי"}. ` +
    `מקומות מומלצים: ${matchingPlaces.map((place) => place.nameHe).join(", ")}. ` +
    `תקציב כולל: $${budget}. ` +
    `בשלב הבא אפשר לחבר מנוע אמיתי שיבנה טיסות, מלון, מסלול יומי והמלצות מותאמות אישית.`;
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  selectedStyle = "";
  searchTerm = "";
  activePlaceId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">בחר עיר</option>';
  citySelect.disabled = true;
  styleSelect.value = "";
  searchInput.value = "";

  closeOverlay();
  renderAll();

  setGlobeView();
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1200);
  map.setView([31.7683, 35.2137], 3);
}

countrySelect.addEventListener("change", (event) => {
  selectedCountry = event.target.value;
  selectedCity = "";
  citySelect.value = "";
  populateCities(selectedCountry);
  closeOverlay();
  renderAll();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  closeOverlay();
  renderAll();
});

styleSelect.addEventListener("change", (event) => {
  selectedStyle = event.target.value;
  renderAll();
});

searchBtn.addEventListener("click", runSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

resetFiltersBtn.addEventListener("click", resetAll);

showGlobeBtn.addEventListener("click", setGlobeView);
showMapBtn.addEventListener("click", setMapView);

closeOverlayBtn.addEventListener("click", closeOverlay);

overlayFocusBtn.addEventListener("click", () => {
  if (activePlaceId) {
    openPlace(activePlaceId, false);
  }
});

premiumPlanBtn.addEventListener("click", buildPremiumPlan);

populateCountries();
populateStyles();
initGlobe();
initMap();
renderAll();
