const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const styleSelect = document.getElementById("styleSelect");
const customStyleInput = document.getElementById("customStyleInput");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchSuggestions = document.getElementById("searchSuggestions");
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
const premiumPlanBtn = document.getElementById("premiumPlanBtn");
const premiumOutput = document.getElementById("premiumOutput");

let selectedCountry = "";
let selectedCity = "";
let selectedStyle = "";
let customStyle = "";
let searchTerm = "";
let activePlaceId = null;

let globe;
let map;
let mapMarkers = [];

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

function getPlaceSearchScore(place, query) {
  const q = normalizeText(query);
  if (!q) return 0;

  let score = 0;

  if (includesNormalized(place.nameHe, q)) score += 120;
  if (includesNormalized(place.nameEn, q)) score += 110;
  if (normalizeText(place.nameHe) === q) score += 80;
  if (normalizeText(place.nameEn) === q) score += 75;

  if (includesNormalized(place.city, q)) score += 90;
  if ((place.cityAliases || []).some((alias) => includesNormalized(alias, q))) score += 85;

  if (includesNormalized(place.country, q)) score += 70;
  if ((place.countryAliases || []).some((alias) => includesNormalized(alias, q))) score += 65;

  if ((place.styles || []).some((style) => includesNormalized(style, q))) score += 55;
  if (includesNormalized(place.descriptionHe, q)) score += 20;

  score += (place.interestScore || 0) / 20;
  return score;
}

function scorePlace(place) {
  let score = place.interestScore || 0;

  if (selectedStyle && place.styles.includes(selectedStyle)) {
    score += 20;
  }

  if (customStyle) {
    const normalizedCustom = normalizeText(customStyle);
    const styleMatch = place.styles.some((style) => normalizeText(style).includes(normalizedCustom));
    const textMatch =
      normalizeText(place.descriptionHe).includes(normalizedCustom) ||
      normalizeText(place.nameHe).includes(normalizedCustom);

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
        ...(place.countryAliases || []),
        ...(place.cityAliases || []),
        ...(place.styles || []),
        place.descriptionHe
      ].join(" ");

      const searchMatch = searchTerm ? includesNormalized(textBlob, searchTerm) : true;

      return countryMatch && cityMatch && styleMatch && customStyleMatch && searchMatch;
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
        priority: 40
      });
    }
  });

  Object.entries(countryCities).forEach(([country, cities]) => {
    cities.forEach((city) => {
      if (includesNormalized(city, q)) {
        suggestions.push({
          type: "city",
          title: city,
          meta: `עיר • ${country}`,
          country,
          city,
          priority: 60
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
        priority: 30
      });
    }
  });

  placesData.forEach((place) => {
    const placeScore = getPlaceSearchScore(place, q);

    if (placeScore > 0) {
      suggestions.push({
        type: "place",
        title: place.nameHe,
        meta: `${place.city}, ${place.country}`,
        placeId: place.id,
        priority: placeScore + 100
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
    div.innerHTML = `
      <div class="search-suggestion-title">${escapeHtml(item.title)}</div>
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
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = "";
    searchInput.value = item.title;
    searchTerm = "";

    renderAll();

    const topPlace = getTopPlaceForCountry(selectedCountry);
    if (topPlace) {
      openPlace(topPlace.id, true);
    }
    return;
  }

  if (item.type === "city") {
    selectedCountry = item.country;
    selectedCity = item.city;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchInput.value = item.title;
    searchTerm = "";

    renderAll();

    const topPlace = getTopPlaceForCity(selectedCountry, selectedCity);
    if (topPlace) {
      openPlace(topPlace.id, true);
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

  if (item.type === "place") {
    const place = placesData.find((p) => p.id === item.placeId);
    if (!place) return;

    selectedCountry = place.country;
    selectedCity = place.city;
    countrySelect.value = selectedCountry;
    populateCities(selectedCountry);
    citySelect.value = selectedCity;
    searchInput.value = place.nameHe;
    searchTerm = place.nameHe;

    renderAll();
    openPlace(place.id, true);
  }
}

function findBestSearchMatch(query) {
  const q = normalizeText(query);
  if (!q) return null;

  let bestPlace = null;
  let bestScore = -1;

  placesData.forEach((place) => {
    const score = getPlaceSearchScore(place, q);
    if (score > bestScore) {
      bestScore = score;
      bestPlace = place;
    }
  });

  return bestScore > 0 ? bestPlace : null;
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
  const q = normalizeText(searchTerm);

  if (!q) return;

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
  searchSuggestions.classList.add("hidden");
}

function buildPremiumPlan() {
  const budget = Number(tripBudget.value || 0);
  const days = Number(tripDays.value || 0);
  const chosenStyle = tripCustomStyle.value.trim() || tripStyle.value || selectedStyle || customStyle;

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
    `מקומות מומלצים: ${matchingPlaces.map((place) => place.nameHe).join(", ")}. ` +
    `תקציב כולל: $${budget}.`;
}

function resetAll() {
  selectedCountry = "";
  selectedCity = "";
  selectedStyle = "";
  customStyle = "";
  searchTerm = "";
  activePlaceId = null;

  countrySelect.value = "";
  citySelect.innerHTML = '<option value="">בחר עיר</option>';
  citySelect.disabled = true;
  styleSelect.value = "";
  customStyleInput.value = "";
  searchInput.value = "";

  closeOverlay();
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

customStyleInput.addEventListener("input", (event) => {
  customStyle = event.target.value.trim();
  renderAll();
});

searchBtn.addEventListener("click", runSearch);

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderSuggestions(searchTerm);
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
