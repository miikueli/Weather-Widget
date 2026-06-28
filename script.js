const cityEl = document.getElementById("city");
const dateEl = document.getElementById("date");
const flagEl = document.getElementById("flag");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const speedEl = document.getElementById("speed");
const batteryEl = document.getElementById("battery");
const batteryIconEl = document.getElementById("batteryIcon");
const helpEl = document.getElementById("help");

const params = new URLSearchParams(window.location.search);

const CONFIG = {
  demo: params.get("demo") === "true",
  help: params.get("help") === "true",
  fixedCity: params.get("city"),
  fixedCountry: (params.get("country") || "FI").toUpperCase(),
  gpsEnabled: params.get("gps") !== "false",
  showBattery: params.get("battery") !== "false",
  weatherEnabled: params.get("weather") !== "false",
  cityRefreshMs: Number(params.get("cityRefreshMs") || 60000),
  weatherRefreshMs: Number(params.get("weatherRefreshMs") || 300000),
};

if (params.get("size") === "small") document.body.classList.add("small");
if (params.get("position") === "left") document.body.classList.add("left");
if (params.get("position") === "top") document.body.classList.add("top");
if (CONFIG.help) helpEl.classList.remove("hidden");

let lastCityFetch = 0;
let lastWeatherFetch = 0;
let lastLat = null;
let lastLon = null;

function updateClock() {
  const now = new Date();
  const date = now.toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const time = now.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit"
  });
  dateEl.textContent = `${date}, ${time}`;
}

function countryCodeToFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🇫🇮";
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

function weatherCodeToIcon(code) {
  if ([0].includes(code)) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if ([3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "☁️";
}

async function geocodeCityToLatLon(city, country = "FI") {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}` +
    `&count=1&language=fi&format=json` +
    `&countryCode=${encodeURIComponent(country)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    countryCode: data.results[0].country_code || country
  };
}

async function updateCityFromGps(lat, lon) {
  const now = Date.now();
  if (now - lastCityFetch < CONFIG.cityRefreshMs) return;
  lastCityFetch = now;

  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=fi`;

    const res = await fetch(url);
    const data = await res.json();

    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      "Tuntematon";

    const country = data.countryCode || "FI";

    cityEl.textContent = `${city}, ${country}`;
    flagEl.textContent = countryCodeToFlagEmoji(country);
  } catch (err) {
    cityEl.textContent = "Sijaintinimi ei saatavilla";
  }
}

async function updateWeather(lat, lon) {
  if (!CONFIG.weatherEnabled) {
    weatherIconEl.textContent = "";
    temperatureEl.textContent = "";
    return;
  }

  const now = Date.now();
  if (now - lastWeatherFetch < CONFIG.weatherRefreshMs) return;
  lastWeatherFetch = now;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;

    temperatureEl.textContent = `${temp} °C`;
    weatherIconEl.textContent = weatherCodeToIcon(code);
  } catch (err) {
    temperatureEl.textContent = "-- °C";
    weatherIconEl.textContent = "☁️";
  }
}

function updateSpeed(position) {
  const speedMps = position.coords.speed;

  if (speedMps === null || speedMps === undefined || Number.isNaN(speedMps)) {
    speedEl.textContent = "0 km/h";
    return;
  }

  const kmh = Math.max(0, Math.round(speedMps * 3.6));
  speedEl.textContent = `${kmh} km/h`;
}

function handlePosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  lastLat = lat;
  lastLon = lon;

  updateSpeed(position);
  updateCityFromGps(lat, lon);
  updateWeather(lat, lon);
}

function handleGeoError(error) {
  cityEl.textContent = "GPS ei käytössä";
  speedEl.textContent = "0 km/h";
}

function startGps() {
  if (!CONFIG.gpsEnabled) {
    cityEl.textContent = "GPS pois";
    speedEl.textContent = "0 km/h";
    return;
  }

  if (!navigator.geolocation) {
    cityEl.textContent = "GPS ei tuettu";
    return;
  }

  navigator.geolocation.watchPosition(
    handlePosition,
    handleGeoError,
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    }
  );
}

async function startFixedCity() {
  try {
    const geo = await geocodeCityToLatLon(CONFIG.fixedCity, CONFIG.fixedCountry);
    cityEl.textContent = `${geo.name}, ${geo.countryCode}`;
    flagEl.textContent = countryCodeToFlagEmoji(geo.countryCode);
    speedEl.textContent = "0 km/h";
    await updateWeather(geo.lat, geo.lon);
    setInterval(() => updateWeather(geo.lat, geo.lon), CONFIG.weatherRefreshMs);
  } catch (err) {
    cityEl.textContent = `${CONFIG.fixedCity}, ${CONFIG.fixedCountry}`;
    flagEl.textContent = countryCodeToFlagEmoji(CONFIG.fixedCountry);
    temperatureEl.textContent = "-- °C";
  }
}

async function startBattery() {
  if (!CONFIG.showBattery) {
    batteryIconEl.textContent = "";
    batteryEl.textContent = "";
    return;
  }

  if (!navigator.getBattery) {
    batteryEl.textContent = "-- %";
    batteryIconEl.textContent = "🔋";
    return;
  }

  try {
    const battery = await navigator.getBattery();

    function updateBatteryText() {
      const percent = Math.round(battery.level * 100);
      batteryEl.textContent = `${percent} %`;
      batteryIconEl.textContent = battery.charging ? "🔌" : "🔋";
    }

    updateBatteryText();
    battery.addEventListener("levelchange", updateBatteryText);
    battery.addEventListener("chargingchange", updateBatteryText);
  } catch (err) {
    batteryEl.textContent = "-- %";
  }
}

function startDemo() {
  const cities = ["Pello, FI", "Tampere, FI", "Kangasala, FI", "Nokia, FI"];
  let i = 0;

  cityEl.textContent = cities[i];
  flagEl.textContent = "🇫🇮";
  temperatureEl.textContent = "16 °C";
  weatherIconEl.textContent = "☁️";
  speedEl.textContent = "0 km/h";
  batteryEl.textContent = "100 %";

  setInterval(() => {
    i = (i + 1) % cities.length;
    cityEl.textContent = cities[i];
    temperatureEl.textContent = `${15 + Math.floor(Math.random() * 7)} °C`;
    speedEl.textContent = `${Math.floor(Math.random() * 85)} km/h`;
    batteryEl.textContent = `${90 + Math.floor(Math.random() * 10)} %`;
  }, 3500);
}

updateClock();
setInterval(updateClock, 10000);

if (CONFIG.demo) {
  startDemo();
} else if (CONFIG.fixedCity) {
  startFixedCity();
} else {
  startGps();
}

startBattery();
