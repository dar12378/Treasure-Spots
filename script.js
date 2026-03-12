const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const styleSelect = document.getElementById("styleSelect");
const customStyleInput = document.getElementById("customStyleInput");
const streetInput = document.getElementById("streetInput");
const houseNumberInput = document.getElementById("houseNumberInput");
const homeAddressInput = document.getElementById("homeAddressInput");

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
let searchTerm = "";
let activePlaceId = null;

let globe;
let map;
let mapMarkers = [];
let routeLine = null;
let startMarker = null;

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

  if (selectedStyle && place.styles.includes(selectedStyle)) {
    score += 20;
  }

  if (customStyle) {
    const styleMatch = place.styles.some((style) => includesNormalized(style, customStyle));
    const textMatch =
      includesNormalized(place.descriptionHe, customStyle) ||
      includesNormalized(place.nameHe, customStyle);

    if (styleMatch || textMatch) {
      score += 25;
    }
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

      const textBlob = [
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

      const searchMatch = searchTerm ? includesNormalized(textBlob, searchTerm) : true;

      return (
        countryMatch &&
        cityMatch &&
        styleMatch &&
        streetMatch &&
        houseNumberMatch &&
        customStyleMatch &&
        searchMatch
      );
    })
    .sort((a, b) => scorePlace(b) - scorePlace(a));
}

function getTopPlaceForCity(country, city) {
  const cityPlaces = placesData
    .filter((place) => place.country === country && place.city === city)
    .sort((a, b) => b.interestScore - a.interestScore);

  return cityPlaces[0] || null;
}

function getTopPlaceForCountry(country) {
  const countryPlaces = placesData
    .filter((place) => place.country === country)
    .sort((a, b) => b.interestScore - a.interestScore);

  return countryPlaces[0] || null;
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
        priority: 80
      });
    }
  });

  placesData.forEach((place) => {
    if (place.neighborhood && includesNormalized(place.neighborhood, q)) {
      suggestions.push({
        type: "neighborhood",
        title: place.neighborhood,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: 260
      });
    }

    if (place.street && includesNormalized(place.street, q)) {
      suggestions.push({
        type: "street",
        title: place.street,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: 255
      });
    }

    if (place.houseNumber && includesNormalized(place.houseNumber, q) && place.street) {
      suggestions.push({
        type: "address",
        title: `${place.street} ${place.houseNumber}`,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: 265
      });
    }

    let placePriority = 0;
    if (includesNormalized(place.nameHe, q)) placePriority += 500;
    if (includesNormalized(place.nameEn, q)) placePriority += 450;

    if (placePriority > 0) {
      suggestions.push({
        type: "place",
        title: place.nameHe,
        meta: `${place.city} • ${place.country}`,
        placeId: place.id,
        priority: placePriority
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

  return unique.slice(0, 10);
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
    if (item.type === "address") icon = "🏠";
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
    searchInput.value = item.title;
    renderAll();

    const topPlace = getTopPlaceForCountry(selectedCountry);
    if (topPlace) {
      openPlace(topPlace.id, true);
    } else {
      alert(`עדיין אין מקומות מוכנים במערכת עבור ${item.country}.`);
    }
    return;
  }

  if (item.type === "city") {
    selectedCountry = item.country;
    selectedCity = item.city;
    searchTerm = "";
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchInput.value = item.title;
    renderAll();

    const topPlace = getTopPlaceForCity(selectedCountry, selectedCity);
    if (topPlace) {
      openPlace(topPlace.id, true);
    } else {
      alert(`אין עדיין מקומות מוכנים במערכת עבור ${item.city}.`);
    }
    return;
  }

  if (item.type === "style") {
    selectedStyle = item.style;
    styleSelect.value = item.style;
    searchInput.value = item.title;
    searchTerm = "";
    renderAll();
    return;
  }

  if (
    item.type === "neighborhood" ||
    item.type === "street" ||
    item.type === "address" ||
    item.type === "place"
  ) {
    const place = placesData.find((p) => p.id === item.placeId);
    if (!place) return;

    selectedCountry = place.country;
    selectedCity = place.city;
    searchTerm = item.title;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchInput.value = item.title;
    renderAll();
    openPlace(place.id, true);
  }
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
  overlayMeta.textContent =
    `${place.city}, ${place.country} • ${place.neighborhood || ""}${place.street ? " • " + place.street : ""}${place.houseNumber ? " " + place.houseNumber : ""} • שעה מקומית: ${getLocalTime(place.timezone)} • עניין: ${place.interestScore}/100 • טיסה משוערת: $${place.estimatedFlightUsd}`;
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

function parseAddressToCoords(addressText) {
  const q = normalizeText(addressText);
  if (!q) return null;

  const matchedPlace = placesData.find((place) => {
    const textBlob = [
      place.city,
      place.country,
      place.neighborhood || "",
      place.street || "",
      place.houseNumber || "",
      ...(place.cityAliases || []),
      ...(place.streetAliases || [])
    ].join(" ");

    return includesNormalized(textBlob, q);
  });

  if (matchedPlace) {
    return {
      lat: matchedPlace.lat,
      lng: matchedPlace.lng,
      label: `${matchedPlace.city} ${matchedPlace.street || ""} ${matchedPlace.houseNumber || ""}`.trim()
    };
  }

  const matchedCity = Object.entries(countryCities).find(([country, cities]) =>
    cities.some((city) => includesNormalized(city, q))
  );

  if (matchedCity) {
    const cityName = matchedCity[1].find((city) => includesNormalized(city, q));
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

function drawWalkingRoute(fromCoords, toCoords) {
  clearRoute();

  routeLine = L.polyline(
    [
      [fromCoords.lat, fromCoords.lng],
      [toCoords.lat, toCoords.lng]
    ],
    {
      weight: 5,
      opacity: 0.8
    }
  ).addTo(map);

  startMarker = L.marker([fromCoords.lat, fromCoords.lng]).addTo(map);
  startMarker.bindPopup(`נקודת התחלה: ${escapeHtml(fromCoords.label)}`).openPopup();

  const bounds = L.latLngBounds([
    [fromCoords.lat, fromCoords.lng],
    [toCoords.lat, toCoords.lng]
  ]);

  map.fitBounds(bounds, { padding: [40, 40] });
}

function createWalkingRoute() {
  const homeText = homeAddressInput.value.trim();

  if (!homeText) {
    alert("כתוב קודם איפה אתה גר.");
    return;
  }

  const places = getFilteredPlaces();

  if (!places.length) {
    alert("אין מקום יעד כרגע למסלול הליכה.");
    return;
  }

  const destination = places[0];
  const homeCoords = parseAddressToCoords(homeText);

  if (!homeCoords) {
    alert("לא הצלחתי להבין את כתובת ההתחלה. נסה לכתוב עיר, רחוב או מקום קרוב.");
    return;
  }

  setMapView();

  setTimeout(() => {
    drawWalkingRoute(homeCoords, {
      lat: destination.lat,
      lng: destination.lng
    });
  }, 200);
}

function runSearch() {
  const raw = searchInput.value.trim();
  const q = normalizeText(raw);
  if (!q) return;

  searchTerm = "";

  const matchingCountry = allCountries.find((country) => includesNormalized(country, q));
  if (matchingCountry) {
    selectedCountry = matchingCountry;
    selectedCity = "";
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = "";
    renderAll();

    const topPlace = getTopPlaceForCountry(selectedCountry);
    if (topPlace) {
      openPlace(topPlace.id, true);
    } else {
      alert(`עדיין אין מקומות מוכנים במערכת עבור ${matchingCountry}.`);
    }

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
    renderAll();

    const topPlace = getTopPlaceForCity(selectedCountry, selectedCity);
    if (topPlace) {
      openPlace(topPlace.id, true);
    } else {
      alert(`אין עדיין מקומות מוכנים במערכת עבור ${matchingCity}.`);
    }

    searchSuggestions.classList.add("hidden");
    return;
  }

  const matchingStyle = allStyles.find((style) => includesNormalized(style, q));
  if (matchingStyle) {
    selectedStyle = matchingStyle;
    styleSelect.value = matchingStyle;
    renderAll();
    searchSuggestions.classList.add("hidden");
    return;
  }

  const exactPlace = placesData.find((place) =>
    includesNormalized(place.nameHe, q) ||
    includesNormalized(place.nameEn, q) ||
    includesNormalized(place.neighborhood || "", q) ||
    includesNormalized(place.street || "", q) ||
    includesNormalized(place.houseNumber || "", q)
  );

  if (exactPlace) {
    selectedCountry = exactPlace.country;
    selectedCity = exactPlace.city;
    searchTerm = raw;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    renderAll();
    openPlace(exactPlace.id, true);
    searchSuggestions.classList.add("hidden");
    return;
  }

  alert("לא נמצא יעד מתאים לחיפוש.");
}

function runFilterSearch() {
  searchTerm = "";
  customStyle = customStyleInput.value.trim();

  selectedCountry = countrySelect.value;
  selectedCity = citySelect.value;
  selectedStyle = styleSelect.value;
  selectedStreet = streetInput.value.trim();
  selectedHouseNumber = houseNumberInput.value.trim();

  renderAll();

  const places = getFilteredPlaces();
  if (places.length > 0) {
    openPlace(places[0].id, true);
  } else {
    alert("לא נמצאו תוצאות לפי הסינון.");
  }
}

function buildPremiumPlan() {
  const budget = Number(tripBudget.value || 0);
  const days = Number(tripDays.value || 0);
  const chosenStyle = tripCustomStyle.value.trim() || tripStyle.value || selectedStyle || customStyle;
  const hotelLevel = tripHotelLevel.value || "4 כוכבים";

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
      const baseMatch = place.country === selectedCountry && place.city === selectedCity;
      if (!baseMatch) return false;

      if (!chosenStyle) return true;

      return (
        place.styles.some((style) => includesNormalized(style, chosenStyle)) ||
        includesNormalized(place.descriptionHe, chosenStyle)
      );
    })
    .sort((a, b) => b.interestScore - a.interestScore)
    .slice(0, 4);

  if (!matchingPlaces.length) {
    premiumOutput.textContent = "לא נמצאו מספיק מקומות מתאימים לתוכנית.";
    return;
  }

  premiumOutput.textContent =
    `תוכנית פרימיום לדוגמה: ${days} ימים ב${selectedCity}, ${selectedCountry}. ` +
    `סגנון: ${chosenStyle || "כללי"}. ` +
    `מלון מומלץ: ${hotelLevel}. ` +
    `מקומות מומלצים: ${matchingPlaces.map((place) => place.nameHe).join(", ")}. ` +
    `תקציב כולל: $${budget}.`;
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  selectedStyle = "";
  customStyle = "";
  selectedStreet = "";
  selectedHouseNumber = "";
  searchTerm = "";
  activePlaceId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">בחר עיר</option>';
  citySelect.disabled = true;
  styleSelect.value = "";
  customStyleInput.value = "";
  streetInput.value = "";
  houseNumberInput.value = "";
  homeAddressInput.value = "";
  searchInput.value = "";

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
  closeOverlay();
  clearRoute();
  renderAll();
});

citySelect.addEventListener("change", (event) => {
  selectedCity = event.target.value;
  closeOverlay();
  clearRoute();
  renderAll();
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

searchInput.addEventListener("input", (event) => {
  const value = event.target.value.trim();
  renderSuggestions(value);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

document.addEventListener("click", (event) => {
  const clickedInside =
    searchInput.contains(event.target) ||
    searchSuggestions.contains(event.target);

  if (!clickedInside) {
    searchSuggestions.classList.add("hidden");
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
