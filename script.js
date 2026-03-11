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

const countryToCode = {
  Israel: "il",
  France: "fr",
  Netherlands: "nl"
};

let map;
let infoWindow;
let directionsService;
let directionsRenderer;
let AdvancedMarkerElement;
let PlaceAutocompleteElement;

let markers = [];
let currentLocationMarker = null;
let searchedPlaceMarker = null;
let activeOrigin = null;

let selectedCountry = "";
let selectedCity = "";

const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const useMyLocationBtn = document.getElementById("useMyLocationBtn");
const travelModeSelect = document.getElementById("travelModeSelect");
const locationStatus = document.getElementById("locationStatus");
const placesList = document.getElementById("placesList");
const emptyPlacesMessage = document.getElementById("emptyPlacesMessage");
const resultsCount = document.getElementById("resultsCount");
const directionsPanel = document.getElementById("directionsPanel");
const searchBoxHost = document.getElementById("searchBoxHost");

window.initApp = async function initApp() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  ({ AdvancedMarkerElement } = await google.maps.importLibrary("marker"));
  ({ PlaceAutocompleteElement } = await google.maps.importLibrary("places"));

  map = new Map(document.getElementById("map"), {
    center: { lat: 31.7683, lng: 35.2137 },
    zoom: 6,
    mapId: "DEMO_MAP_ID",
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true
  });

  infoWindow = new InfoWindow();

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    panel: directionsPanel,
    suppressMarkers: false
  });

  populateCountries();
  initSearchBar();
  bindEvents();
  renderPlacesList();
};

function bindEvents() {
  countrySelect.addEventListener("change", () => {
    selectedCountry = countrySelect.value;
    selectedCity = "";
    citySelect.value = "";
    populateCities(selectedCountry);
    updateAutocompleteRegion();
    clearDirections();
    renderEverything();
  });

  citySelect.addEventListener("change", () => {
    selectedCity = citySelect.value;
    clearDirections();
    renderEverything();
  });

  resetFiltersBtn.addEventListener("click", () => {
    selectedCountry = "";
    selectedCity = "";
    countrySelect.value = "";
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;
    clearDirections();
    renderEverything();
    map.setCenter({ lat: 31.7683, lng: 35.2137 });
    map.setZoom(3);
  });

  useMyLocationBtn.addEventListener("click", useMyLocation);
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

function initSearchBar() {
  const wrapper = document.createElement("div");
  wrapper.className = "search-card";

  const placeAutocomplete = new PlaceAutocompleteElement({});
  placeAutocomplete.id = "globalPlaceSearch";
  placeAutocomplete.setAttribute("placeholder", "Search a place like Google Maps...");

  wrapper.appendChild(placeAutocomplete);
  searchBoxHost.appendChild(wrapper);

  updateAutocompleteRegion();

  placeAutocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "viewport"]
      });

      if (!place.location) return;

      if (searchedPlaceMarker) {
        searchedPlaceMarker.map = null;
      }

      searchedPlaceMarker = createMarker(
        { lat: place.location.lat(), lng: place.location.lng() },
        "search",
        place.displayName || "Searched place"
      );

      activeOrigin = {
        lat: place.location.lat(),
        lng: place.location.lng(),
        label: place.displayName || "Searched place"
      };

      locationStatus.textContent = `Origin: ${activeOrigin.label}`;

      if (place.viewport) {
        map.fitBounds(place.viewport);
      } else {
        map.setCenter(place.location);
        map.setZoom(15);
      }

      infoWindow.setContent(`
        <div>
          <h3>${escapeHtml(place.displayName || "Selected place")}</h3>
          <p>${escapeHtml(place.formattedAddress || "")}</p>
        </div>
      `);
      infoWindow.open({
        map,
        anchor: searchedPlaceMarker
      });
    } catch (error) {
      console.error(error);
      alert("Could not load place details.");
    }
  });
}

function updateAutocompleteRegion() {
  const el = document.getElementById("globalPlaceSearch");
  if (!el) return;

  if (selectedCountry && countryToCode[selectedCountry]) {
    el.setAttribute("included-region-codes", countryToCode[selectedCountry]);
  } else {
    el.removeAttribute("included-region-codes");
  }
}

function getFilteredSpots() {
  return spots.filter((spot) => {
    const countryOk = selectedCountry ? spot.country === selectedCountry : false;
    const cityOk = selectedCity ? spot.city === selectedCity : false;
    return countryOk && cityOk;
  });
}

function renderEverything() {
  renderPlacesList();
  renderMarkers();
}

function renderPlacesList() {
  const filtered = getFilteredSpots();
  placesList.innerHTML = "";
  resultsCount.textContent = filtered.length;

  if (!selectedCountry || !selectedCity) {
    emptyPlacesMessage.textContent = "Choose a country and city to show treasure spots.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  if (!filtered.length) {
    emptyPlacesMessage.textContent = "No spots found for this city.";
    emptyPlacesMessage.style.display = "block";
    return;
  }

  emptyPlacesMessage.style.display = "none";

  filtered.forEach((spot) => {
    const item = document.createElement("div");
    item.className = "place-item";
    item.innerHTML = `
      <img src="${spot.image}" alt="${escapeHtml(spot.name)}" />
      <div class="place-item-content">
        <h3>${escapeHtml(spot.name)}</h3>
        <div class="place-meta">${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</div>
        <div class="place-desc">${escapeHtml(spot.description)}</div>
        <div class="place-actions">
          <button class="focus-btn" data-id="${spot.id}">Show on map</button>
          <button class="route-btn" data-id="${spot.id}">Get route</button>
        </div>
      </div>
    `;

    placesList.appendChild(item);
  });

  placesList.querySelectorAll(".focus-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      focusSpot(Number(btn.dataset.id));
    });
  });

  placesList.querySelectorAll(".route-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      buildRouteToSpot(Number(btn.dataset.id));
    });
  });
}

function clearMarkers() {
  markers.forEach((marker) => {
    marker.map = null;
  });
  markers = [];
}

function renderMarkers() {
  clearMarkers();

  if (!selectedCountry || !selectedCity) {
    return;
  }

  const filtered = getFilteredSpots();

  filtered.forEach((spot) => {
    const marker = createMarker(
      { lat: spot.lat, lng: spot.lng },
      "spot",
      spot.name
    );

    marker.__spotId = spot.id;
    marker.addListener("click", () => {
      openSpotCard(marker, spot);
    });

    markers.push(marker);
  });

  fitMapToSpots(filtered);
}

function fitMapToSpots(filtered) {
  if (!filtered.length) return;

  const bounds = new google.maps.LatLngBounds();
  filtered.forEach((spot) => bounds.extend({ lat: spot.lat, lng: spot.lng }));
  map.fitBounds(bounds);

  if (filtered.length === 1) {
    map.setZoom(15);
  }
}

function createMarker(position, type, title) {
  const pin = document.createElement("div");
  pin.className = `pin-wrapper ${type === "user" ? "pin-user" : ""} ${type === "search" ? "pin-search" : ""}`;
  pin.innerHTML = `
    <div class="pin-shape"></div>
    <div class="pin-inner"></div>
  `;

  return new AdvancedMarkerElement({
    map,
    position,
    title,
    content: pin
  });
}

function openSpotCard(marker, spot) {
  infoWindow.setContent(`
    <div style="max-width:240px;">
      <h3>${escapeHtml(spot.name)}</h3>
      <p><strong>${escapeHtml(spot.city)}, ${escapeHtml(spot.country)}</strong></p>
      <p>${escapeHtml(spot.description)}</p>
      <p style="margin-top:8px; color:#1a73e8; font-weight:bold;">Click "Get route" in the side panel for navigation.</p>
    </div>
  `);

  infoWindow.open({
    map,
    anchor: marker
  });
}

function focusSpot(spotId) {
  const spot = spots.find((item) => item.id === spotId);
  if (!spot) return;

  map.panTo({ lat: spot.lat, lng: spot.lng });
  map.setZoom(16);

  const marker = markers.find((m) => m.__spotId === spotId);
  if (marker) {
    openSpotCard(marker, spot);
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      activeOrigin = {
        ...coords,
        label: "My location"
      };

      locationStatus.textContent = "Origin: My location";

      if (currentLocationMarker) {
        currentLocationMarker.map = null;
      }

      currentLocationMarker = createMarker(coords, "user", "My location");

      map.panTo(coords);
      map.setZoom(14);

      infoWindow.setContent(`
        <div>
          <h3>My location</h3>
          <p>Your current location is now set as route origin.</p>
        </div>
      `);

      infoWindow.open({
        map,
        anchor: currentLocationMarker
      });
    },
    (error) => {
      console.error(error);
      alert("Location permission denied or unavailable.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function buildRouteToSpot(spotId) {
  const spot = spots.find((item) => item.id === spotId);
  if (!spot) return;

  if (!activeOrigin) {
    alert("First click 'Use my location' or search a place in the top search bar.");
    return;
  }

  clearDirections();

  directionsService.route(
    {
      origin: { lat: activeOrigin.lat, lng: activeOrigin.lng },
      destination: { lat: spot.lat, lng: spot.lng },
      travelMode: google.maps.TravelMode[travelModeSelect.value]
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      } else {
        alert("Could not calculate route: " + status);
      }
    }
  );
}

function clearDirections() {
  directionsRenderer.set("directions", null);
  directionsPanel.innerHTML = "Select a place and get route directions here.";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => {
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
