const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const styleSelect = document.getElementById("styleSelect");
const customStyleInput = document.getElementById("customStyleInput");
const streetInput = document.getElementById("streetInput");
const houseNumberInput = document.getElementById("houseNumberInput");
const neighborhoodInput = document.getElementById("neighborhoodInput");
const homeAddressInput = document.getElementById("homeAddressInput");
const viaAddressInput = document.getElementById("viaAddressInput");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchSuggestions = document.getElementById("searchSuggestions");
const filterSearchBtn = document.getElementById("filterSearchBtn");
const walkRouteBtn = document.getElementById("walkRouteBtn");
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

const tripCountrySelect = document.getElementById("tripCountrySelect");
const tripCitySelect = document.getElementById("tripCitySelect");
const tripBudget = document.getElementById("tripBudget");
const tripDays = document.getElementById("tripDays");
const tripStyle = document.getElementById("tripStyle");
const tripCustomStyle = document.getElementById("tripCustomStyle");
const tripHotelLevel = document.getElementById("tripHotelLevel");
const premiumPlanBtn = document.getElementById("premiumPlanBtn");
const premiumOutput = document.getElementById("premiumOutput");

let selectedCountry = "";
let selectedCity = "";
let selectedStyle = "";
let customStyle = "";
let selectedStreet = "";
let selectedHouseNumber = "";
let selectedNeighborhood = "";
let searchTerm = "";
let activePlaceId = null;

let globe;
let map;
let mapMarkers = [];
let routeLine = null;
let startMarker = null;
let viaMarker = null;
let vacationRouteLines = [];

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/["'`´]/g, "")
    .replace(/\s+/g, " ");
}

function includesNormalized(text, query) {
  return normalizeText(text).includes(normalizeText(query));
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

function getTextBlob(place) {
  return [
    place.nameHe,
    place.nameEn,
    place.country,
    place.city,
    place.neighborhood || "",
    place.street || "",
    place.houseNumber || "",
    ...(place.countryAliases || []),
    ...(place.cityAliases || []),
    ...(place.neighborhoodAliases || []),
    ...(place.streetAliases || []),
    ...(place.styles || []),
    place.descriptionHe
  ].join(" ");
}

function populateCountries() {
  allCountries.forEach((country) => {
    const optionA = document.createElement("option");
    optionA.value = country;
    optionA.textContent = country;
    countrySelect.appendChild(optionA);

    const optionB = document.createElement("option");
    optionB.value = country;
    optionB.textContent = country;
    tripCountrySelect.appendChild(optionB);
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

function populateTripCities(country) {
  tripCitySelect.innerHTML = '<option value="">בחר עיר</option>';

  if (!country || !countryCities[country]) {
    tripCitySelect.disabled = true;
    return;
  }

  countryCities[country].forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    tripCitySelect.appendChild(option);
  });

  tripCitySelect.disabled = false;
}

function populateStyles() {
  allStyles.forEach((style) => {
    const optionA = document.createElement("option");
    optionA.value = style;
    optionA.textContent = style;
    styleSelect.appendChild(optionA);

    const optionB = document.createElement("option");
    optionB.value = style;
    optionB.textContent = style;
    tripStyle.appendChild(optionB);
  });
}

function scorePlace(place) {
  let score = place.interestScore || 0;

  if (selectedStyle && place.styles.includes(selectedStyle)) score += 20;

  if (customStyle) {
    const match =
      place.styles.some((style) => includesNormalized(style, customStyle)) ||
      includesNormalized(place.descriptionHe, customStyle) ||
      includesNormalized(place.nameHe, customStyle);

    if (match) score += 25;
  }

  if (place.category === "popular") score += 5;

  return score;
}

function getFilteredPlaces() {
  return placesData
    .filter((place) => {
      const countryMatch = selectedCountry ? place.country === selectedCountry : true;
      const cityMatch = selectedCity ? place.city === selectedCity : true;
      const styleMatch = selectedStyle ? place.styles.includes(selectedStyle) : true;

      const neighborhoodMatch = selectedNeighborhood
        ? (
            includesNormalized(place.neighborhood || "", selectedNeighborhood) ||
            (place.neighborhoodAliases || []).some((alias) => includesNormalized(alias, selectedNeighborhood))
          )
        : true;

      const streetMatch = selectedStreet
        ? (
            includesNormalized(place.street || "", selectedStreet) ||
            (place.streetAliases || []).some((alias) => includesNormalized(alias, selectedStreet))
          )
        : true;

      const houseNumberMatch = selectedHouseNumber
        ? includesNormalized(place.houseNumber || "", selectedHouseNumber)
        : true;

      const customStyleMatch = customStyle
        ? (
            place.styles.some((style) => includesNormalized(style, customStyle)) ||
            includesNormalized(place.descriptionHe, customStyle) ||
            includesNormalized(place.nameHe, customStyle)
          )
        : true;

      const searchMatch = searchTerm ? includesNormalized(getTextBlob(place), searchTerm) : true;

      return (
        countryMatch &&
        cityMatch &&
        styleMatch &&
        neighborhoodMatch &&
        streetMatch &&
        houseNumberMatch &&
        customStyleMatch &&
        searchMatch
      );
    })
    .sort((a, b) => scorePlace(b) - scorePlace(a));
}

function getTopPlaceForCountry(country) {
  return placesData
    .filter((place) => place.country === country)
    .sort((a, b) => b.interestScore - a.interestScore)[0] || null;
}

function getTopPlaceForCity(country, city) {
  return placesData
    .filter((place) => place.country === country && place.city === city)
    .sort((a, b) => b.interestScore - a.interestScore)[0] || null;
}

function buildSuggestions(query) {
  const q = normalizeText(query);
  if (!q) return [];

  const suggestions = [];

  allCountries.forEach((country) => {
    if (includesNormalized(country, q)) {
      suggestions.push({
        type: "country",
        title: country,
        meta: "מדינה",
        country,
        priority: 100
      });
    }
  });

  Object.entries(countryCities).forEach(([country, cities]) => {
    cities.forEach((city) => {
      if (includesNormalized(city, q)) {
        suggestions.push({
          type: "city",
          title: city,
          meta: country,
          country,
          city,
          priority: 220
        });
      }
    });
  });

  allStyles.forEach((style) => {
    if (includesNormalized(style, q)) {
      suggestions.push({
        type: "style",
        title: style,
        meta: "סגנון",
        style,
        priority: 90
      });
    }
  });

  placesData.forEach((place) => {
    const blob = getTextBlob(place);

    if (includesNormalized(blob, q)) {
      suggestions.push({
        type: "place",
        title: place.nameHe,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: includesNormalized(place.nameHe, q) ? 520 : 300
      });
    }

    if (place.neighborhood && includesNormalized(place.neighborhood, q)) {
      suggestions.push({
        type: "neighborhood",
        title: place.neighborhood,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: 280
      });
    }

    if (place.street && includesNormalized(place.street, q)) {
      suggestions.push({
        type: "street",
        title: place.street,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: 275
      });
    }
  });

  const unique = [];
  const seen = new Set();

  suggestions
    .sort((a, b) => b.priority - a.priority)
    .forEach((item) => {
      const key = `${item.type}-${item.title}-${item.meta}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

  return unique.slice(0, 12);
}

function renderSuggestions(query) {
  const suggestions = buildSuggestions(query);
  searchSuggestions.innerHTML = "";

  if (!suggestions.length) {
    searchSuggestions.classList.add("hidden");
    return;
  }

  suggestions.forEach((item) => {
    const div = document.createElement("div");
    div.className = "search-suggestion-item";

    let icon = "📍";
    if (item.type === "country") icon = "🌍";
    if (item.type === "city") icon = "🏙️";
    if (item.type === "style") icon = "✨";
    if (item.type === "neighborhood") icon = "🏘️";
    if (item.type === "street") icon = "🛣️";
    if (item.type === "place") icon = "📌";

    div.innerHTML = `
      <div class="search-suggestion-title">${icon} ${escapeHtml(item.title)}</div>
      <div class="search-suggestion-meta">${escapeHtml(item.meta)}</div>
    `;

    div.addEventListener("click", () => {
      applySuggestion(item);
      searchSuggestions.classList.add("hidden");
    });

    searchSuggestions.appendChild(div);
  });

  searchSuggestions.classList.remove("hidden");
}

function applySuggestion(item) {
  if (item.type === "country") {
    selectedCountry = item.country;
    selectedCity = "";
    searchTerm = "";
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = "";
    renderAll();

    const topPlace = getTopPlaceForCountry(selectedCountry);
    if (topPlace) openPlace(topPlace.id, true);
    return;
  }

  if (item.type === "city") {
    selectedCountry = item.country;
    selectedCity = item.city;
    searchTerm = "";
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    renderAll();

    const topPlace = getTopPlaceForCity(selectedCountry, selectedCity);
    if (topPlace) openPlace(topPlace.id, true);
    return;
  }

  if (item.type === "style") {
    selectedStyle = item.style;
    styleSelect.value = item.style;
    searchTerm = "";
    renderAll();
    return;
  }

  const place = placesData.find((p) => p.id === item.placeId);
  if (!place) return;

  selectedCountry = place.country;
  selectedCity = place.city;
  searchTerm = item.title;
  countrySelect.value = selectedCountry;
  populateCities(selectedCountry);
  citySelect.value = selectedCity;
  renderAll();
  openPlace(place.id, true);
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

function clearRoute() {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  if (startMarker) {
    map.removeLayer(startMarker);
    startMarker = null;
  }

  if (viaMarker) {
    map.removeLayer(viaMarker);
    viaMarker = null;
  }

  vacationRouteLines.forEach((line) => map.removeLayer(line));
  vacationRouteLines = [];
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
        ${escapeHtml(place.neighborhood || "")}${place.neighborhood ? "<br>" : ""}
        ${escapeHtml(place.street || "")}${place.street ? " " : ""}${escapeHtml(place.houseNumber || "")}<br>
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
          ${escapeHtml(place.neighborhood || "")}${place.neighborhood ? " • " : ""}${escapeHtml(place.street || "")}${place.street ? " " : ""}${escapeHtml(place.houseNumber || "")}<br>
          זמן מומלץ: ${escapeHtml(place.visitTime || "בוקר")} • עניין: ${place.interestScore}/100 • עלות: $${place.estimatedCostUsd || 0}
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
  overlayMeta.textContent =
    `${place.city}, ${place.country} • ${place.neighborhood || ""}${place.street ? " • " + place.street : ""}${place.houseNumber ? " " + place.houseNumber : ""} • זמן מומלץ: ${place.visitTime || "בוקר"} • עלות: $${place.estimatedCostUsd || 0}`;
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
      if (marker) marker.openPopup();
    }, 1400);
  }
}

function renderAll() {
  renderPlacesList();
  renderGlobeMarkers();
  renderMapMarkers();
}

function parseAddressToCoords(addressText) {
  const q = normalizeText(addressText);
  if (!q) return null;

  const matchedPlace = placesData.find((place) => includesNormalized(getTextBlob(place), q));
  if (matchedPlace) {
    return {
      lat: matchedPlace.lat,
      lng: matchedPlace.lng,
      label: `${matchedPlace.city} ${matchedPlace.street || ""} ${matchedPlace.houseNumber || ""}`.trim()
    };
  }

  const matchedHotel = hotelsData.find((hotel) =>
    includesNormalized(`${hotel.nameHe} ${hotel.city} ${hotel.country}`, q)
  );

  if (matchedHotel) {
    return {
      lat: matchedHotel.lat,
      lng: matchedHotel.lng,
      label: matchedHotel.nameHe
    };
  }

  const matchedCityEntry = Object.entries(countryCities).find(([country, cities]) =>
    cities.some((city) => includesNormalized(city, q))
  );

  if (matchedCityEntry) {
    const cityName = matchedCityEntry[1].find((city) => includesNormalized(city, q));
    const placeInCity = placesData.find((place) => place.city === cityName);
    if (placeInCity) {
      return {
        lat: placeInCity.lat,
        lng: placeInCity.lng,
        label: cityName
      };
    }
  }

  return null;
}

function drawWalkingRoute(points, labels) {
  clearRoute();

  routeLine = L.polyline(points, {
    weight: 5,
    opacity: 0.85
  }).addTo(map);

  startMarker = L.marker(points[0]).addTo(map);
  startMarker.bindPopup(`נקודת התחלה: ${escapeHtml(labels.start)}`).openPopup();

  if (points.length === 3) {
    viaMarker = L.marker(points[1]).addTo(map);
    viaMarker.bindPopup(`עובר דרך: ${escapeHtml(labels.via)}`);
  }

  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds, { padding: [40, 40] });
}

function createWalkingRoute() {
  const homeText = homeAddressInput.value.trim();
  const viaText = viaAddressInput.value.trim();

  if (!homeText) {
    alert("כתוב קודם איפה אתה גר.");
    return;
  }

  const places = getFilteredPlaces();
  if (!places.length) {
    alert("אין כרגע יעד למסלול הליכה. בחר קודם יעד.");
    return;
  }

  const destination = places[0];
  const homeCoords = parseAddressToCoords(homeText);

  if (!homeCoords) {
    alert("לא הצלחתי להבין את כתובת ההתחלה.");
    return;
  }

  let points = [
    [homeCoords.lat, homeCoords.lng],
    [destination.lat, destination.lng]
  ];

  const labels = {
    start: homeCoords.label,
    via: "",
    end: destination.nameHe
  };

  if (viaText) {
    const viaCoords = parseAddressToCoords(viaText);
    if (!viaCoords) {
      alert("לא הצלחתי להבין את נקודת המעבר.");
      return;
    }

    points = [
      [homeCoords.lat, homeCoords.lng],
      [viaCoords.lat, viaCoords.lng],
      [destination.lat, destination.lng]
    ];
    labels.via = viaCoords.label;
  }

  setMapView();
  setTimeout(() => drawWalkingRoute(points, labels), 200);
}

function runSearch() {
  const raw = searchInput.value.trim();
  const q = normalizeText(raw);
  if (!q) return;

  searchTerm = raw;

  const matchingCountry = allCountries.find((country) => includesNormalized(country, q));
  if (matchingCountry) {
    selectedCountry = matchingCountry;
    selectedCity = "";
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = "";
    searchTerm = "";
    renderAll();

    const topPlace = getTopPlaceForCountry(selectedCountry);
    if (topPlace) openPlace(topPlace.id, true);
    else setGlobeView();

    searchSuggestions.classList.add("hidden");
    return;
  }

  let matchingCity = null;
  let matchingCityCountry = null;

  Object.entries(countryCities).some(([country, cities]) => {
    const city = cities.find((c) => includesNormalized(c, q));
    if (city) {
      matchingCity = city;
      matchingCityCountry = country;
      return true;
    }
    return false;
  });

  if (matchingCity && matchingCityCountry) {
    selectedCountry = matchingCityCountry;
    selectedCity = matchingCity;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchTerm = "";
    renderAll();

    const topPlace = getTopPlaceForCity(selectedCountry, selectedCity);
    if (topPlace) openPlace(topPlace.id, true);
    else setMapView();

    searchSuggestions.classList.add("hidden");
    return;
  }

  const matchingStyle = allStyles.find((style) => includesNormalized(style, q));
  if (matchingStyle) {
    selectedStyle = matchingStyle;
    styleSelect.value = matchingStyle;
    searchTerm = "";
    renderAll();
    searchSuggestions.classList.add("hidden");
    return;
  }

  const allMatches = placesData.filter((place) => includesNormalized(getTextBlob(place), q));

  if (allMatches.length > 0) {
    const best = allMatches.sort((a, b) => scorePlace(b) - scorePlace(a))[0];
    selectedCountry = best.country;
    selectedCity = best.city;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchTerm = raw;
    renderAll();
    openPlace(best.id, true);
    searchSuggestions.classList.add("hidden");
    return;
  }

  renderAll();
  searchSuggestions.classList.add("hidden");
}

function runFilterSearch() {
  customStyle = customStyleInput.value.trim();
  selectedCountry = countrySelect.value;
  selectedCity = citySelect.value;
  selectedStyle = styleSelect.value;
  selectedStreet = streetInput.value.trim();
  selectedHouseNumber = houseNumberInput.value.trim();
  selectedNeighborhood = neighborhoodInput.value.trim();
  searchTerm = "";

  renderAll();

  const places = getFilteredPlaces();
  if (places.length > 0) openPlace(places[0].id, true);
}

function drawVacationPlanOnMap(hotel, attractionsByDay) {
  clearRoute();
  setMapView();

  setTimeout(() => {
    const boundsPoints = [[hotel.lat, hotel.lng]];

    const hotelMarker = L.marker([hotel.lat, hotel.lng]).addTo(map);
    hotelMarker.bindPopup(`מלון: ${escapeHtml(hotel.nameHe)}`).openPopup();

    attractionsByDay.forEach((dayGroup) => {
      const dayPoints = [[hotel.lat, hotel.lng]];

      dayGroup.items.forEach((place) => {
        dayPoints.push([place.lat, place.lng]);
        boundsPoints.push([place.lat, place.lng]);

        const marker = L.marker([place.lat, place.lng], {
          icon: createMapPinIcon()
        }).addTo(map);

        marker.bindPopup(
          `${escapeHtml(place.nameHe)}<br>זמן מומלץ: ${escapeHtml(dayGroup.slotMap[place.id])}`
        );
      });

      const line = L.polyline(dayPoints, {
        weight: 4,
        opacity: 0.8
      }).addTo(map);

      vacationRouteLines.push(line);
    });

    const bounds = L.latLngBounds(boundsPoints);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, 200);
}

function chooseHotel(country, city, style, hotelLevel, hotelBudgetTotal, days) {
  const matchingHotels = hotelsData
    .filter((hotel) => hotel.country === country && hotel.city === city)
    .filter((hotel) => (hotelLevel ? hotel.level === hotelLevel : true))
    .filter((hotel) => hotel.nightlyUsd * days <= hotelBudgetTotal * 1.15)
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (style && hotel.styles.includes(style)) scoreA += 20;
      if (style && hotel.styles.includes(style)) scoreB += 20;

      scoreA += 500 - hotel.nightlyUsd;
      scoreB += 500 - hotel.nightlyUsd;

      return scoreB - scoreA;
    });

  if (matchingHotels.length > 0) return matchingHotels[0];

  const fallback = hotelsData
    .filter((hotel) => hotel.country === country && hotel.city === city)
    .sort((a, b) => a.nightlyUsd - b.nightlyUsd);

  return fallback[0] || null;
}

function buildDailyPlan(attractions, days) {
  const result = [];
  const slots = ["בוקר", "צהריים", "ערב"];

  for (let day = 0; day < days; day++) {
    const dayItems = [];
    const slotMap = {};

    for (let j = 0; j < 3; j++) {
      const attraction = attractions[(day * 3 + j) % attractions.length];
      if (!dayItems.find((item) => item.id === attraction.id)) {
        dayItems.push(attraction);
        slotMap[attraction.id] = slots[j];
      }
    }

    result.push({
      dayNumber: day + 1,
      items: dayItems,
      slotMap
    });
  }

  return result;
}

function estimateFlightCost(country, peopleCount) {
  const place = placesData.find((p) => p.country === country);
  const perPerson = place ? place.estimatedFlightUsd : 700;
  return perPerson * peopleCount;
}

function buildVacationPlan() {
  const country = tripCountrySelect.value;
  const city = tripCitySelect.value;
  const budget = Number(tripBudget.value || 0);
  const days = Number(tripDays.value || 0);
  const style = tripCustomStyle.value.trim() || tripStyle.value || "";
  const hotelLevel = tripHotelLevel.value || "";
  const peopleCount = 4;

  if (!country || !city) {
    premiumOutput.innerHTML = "בחר מדינה ועיר.";
    return;
  }

  if (!budget || !days) {
    premiumOutput.innerHTML = "הכנס תקציב ומספר ימים.";
    return;
  }

  const flightBudget = Math.round(budget * 0.35);
  const hotelBudget = Math.round(budget * 0.40);
  const activitiesBudget = Math.round(budget * 0.25);

  const estimatedFlight = estimateFlightCost(country, peopleCount);

  const cityAttractions = placesData
    .filter((place) => place.country === country && place.city === city)
    .filter((place) => {
      if (!style) return true;
      return (
        place.styles.includes(style) ||
        includesNormalized(place.descriptionHe, style) ||
        includesNormalized(place.nameHe, style)
      );
    })
    .sort((a, b) => b.interestScore - a.interestScore);

  const usableAttractions = cityAttractions.length
    ? cityAttractions
    : placesData
        .filter((place) => place.country === country && place.city === city)
        .sort((a, b) => b.interestScore - a.interestScore);

  if (!usableAttractions.length) {
    premiumOutput.innerHTML = `אין עדיין מספיק אטרקציות מוכנות במערכת עבור ${city}.`;
    return;
  }

  const hotel = chooseHotel(country, city, style, hotelLevel, hotelBudget, days);

  if (!hotel) {
    premiumOutput.innerHTML = `אין עדיין מלון מוכן במערכת עבור ${city}.`;
    return;
  }

  const dailyPlan = buildDailyPlan(usableAttractions, days);

  const attractionsTotalCost = dailyPlan
    .flatMap((day) => day.items)
    .reduce((sum, item) => sum + (item.estimatedCostUsd || 0), 0);

  const hotelTotalCost = hotel.nightlyUsd * days;
  const totalEstimated = estimatedFlight + hotelTotalCost + attractionsTotalCost;

  selectedCountry = country;
  selectedCity = city;
  countrySelect.value = country;
  populateCities(country);
  citySelect.value = city;
  searchTerm = "";
  renderAll();

  drawVacationPlanOnMap(hotel, dailyPlan);

  let html = `
    <div class="trip-plan-block">
      <strong>יעד:</strong> ${escapeHtml(city)}, ${escapeHtml(country)}<br>
      <strong>מספר ימים:</strong> ${days}<br>
      <strong>סגנון:</strong> ${escapeHtml(style || "כללי")}<br>
      <strong>מלון שנבחר:</strong> ${escapeHtml(hotel.nameHe)} (${escapeHtml(hotel.level)})<br>
      <strong>עלות מלון משוערת:</strong> $${hotelTotalCost}<br>
      <strong>עלות טיסה משוערת למשפחה:</strong> $${estimatedFlight}<br>
      <strong>עלות אטרקציות משוערת:</strong> $${attractionsTotalCost}<br>
      <strong>תקציב כולל:</strong> $${budget}<br>
      <strong>סה"כ משוער:</strong> $${totalEstimated}<br>
      <strong>התאמה לתקציב:</strong> ${totalEstimated <= budget ? "כן" : "גבוה מהתקציב"}
    </div>
  `;

  dailyPlan.forEach((dayGroup) => {
    html += `<div class="trip-day-block"><strong>יום ${dayGroup.dayNumber}</strong><br>`;
    dayGroup.items.forEach((place) => {
      html += `${escapeHtml(dayGroup.slotMap[place.id])} – ${escapeHtml(place.nameHe)} (עלות: $${place.estimatedCostUsd || 0})<br>`;
    });
    html += `</div>`;
  });

  premiumOutput.innerHTML = html;
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  selectedStyle = "";
  customStyle = "";
  selectedStreet = "";
  selectedHouseNumber = "";
  selectedNeighborhood = "";
  searchTerm = "";
  activePlaceId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">בחר עיר</option>';
  citySelect.disabled = true;
  styleSelect.value = "";
  customStyleInput.value = "";
  streetInput.value = "";
  houseNumberInput.value = "";
  neighborhoodInput.value = "";
  homeAddressInput.value = "";
  viaAddressInput.value = "";

  tripCountrySelect.value = "";
  tripCitySelect.innerHTML = '<option value="">בחר עיר</option>';
  tripCitySelect.disabled = true;
  tripBudget.value = "";
  tripDays.value = "";
  tripStyle.value = "";
  tripCustomStyle.value = "";
  tripHotelLevel.value = "";

  searchInput.value = "";
  premiumOutput.innerHTML = "עדיין לא נבנתה תוכנית.";

  closeOverlay();
  clearRoute();
  renderAll();

  setGlobeView();
  globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1200);
  map.setView([31.7683, 35.2137], 3);
  searchSuggestions.classList.add("hidden");
}

countrySelect.addEventListener("change", (event) => {
  selectedCountry = event.target.value;
  selectedCity = "";
  citySelect.value = "";
  populateCities(selectedCountry);
  clearRoute();
  closeOverlay();
  renderAll();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  clearRoute();
  closeOverlay();
  renderAll();
});

tripCountrySelect.addEventListener("change", (event) => {
  populateTripCities(event.target.value);
});

styleSelect.addEventListener("change", (event) => {
  selectedStyle = event.target.value;
  renderAll();
});

customStyleInput.addEventListener("input", (event) => {
  customStyle = event.target.value.trim();
  renderAll();
});

searchBtn.addEventListener("click", runSearch);
filterSearchBtn.addEventListener("click", runFilterSearch);
walkRouteBtn.addEventListener("click", createWalkingRoute);
premiumPlanBtn.addEventListener("click", buildVacationPlan);

searchInput.addEventListener("input", (event) => {
  renderSuggestions(event.target.value.trim());
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runSearch();
});

document.addEventListener("click", (event) => {
  const clickedInside =
    searchInput.contains(event.target) ||
    searchSuggestions.contains(event.target);

  if (!clickedInside) searchSuggestions.classList.add("hidden");
});

resetFiltersBtn.addEventListener("click", resetAll);
showGlobeBtn.addEventListener("click", setGlobeView);
showMapBtn.addEventListener("click", setMapView);
closeOverlayBtn.addEventListener("click", closeOverlay);

overlayFocusBtn.addEventListener("click", () => {
  if (activePlaceId) openPlace(activePlaceId, false);
});

populateCountries();
populateStyles();
initGlobe();
initMap();
renderAll();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("sw.js")
      .then(function (registration) {
        console.log("Service Worker Registered:", registration);
      })
      .catch(function (error) {
        console.log("Service Worker Registration Failed:", error);
      });
  });
}
