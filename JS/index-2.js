// ===================================================
// BORKATRACE - DRIVERS & OPENF1 LIVE ECOSYSTEM ENGINE
// ===================================================

// Accurate ISO 3166-1 alpha-2 mapping for Formula 1 Drivers
const DRIVER_COUNTRY_MAP = {
  VER: { code: "nl", name: "Netherlands" },
  HAM: { code: "gb", name: "United Kingdom" },
  RUS: { code: "gb", name: "United Kingdom" },
  NOR: { code: "gb", name: "United Kingdom" },
  PIA: { code: "au", name: "Australia" },
  LEC: { code: "mc", name: "Monaco" },
  SAI: { code: "es", name: "Spain" },
  ALO: { code: "es", name: "Spain" },
  STR: { code: "ca", name: "Canada" },
  GAS: { code: "fr", name: "France" },
  OCO: { code: "fr", name: "France" },
  TSU: { code: "jp", name: "Japan" },
  HUL: { code: "de", name: "Germany" },
  ALB: { code: "th", name: "Thailand" },
  BOT: { code: "fi", name: "Finland" },
  ZHO: { code: "cn", name: "China" },
  MAG: { code: "dk", name: "Denmark" },
  PER: { code: "mx", name: "Mexico" },
  SAR: { code: "us", name: "United States" },
  RIC: { code: "au", name: "Australia" },
  LAW: { code: "nz", name: "New Zealand" },
  BEA: { code: "gb", name: "United Kingdom" },
  COL: { code: "ar", name: "Argentina" },
  DOO: { code: "au", name: "Australia" },
  BOR: { code: "br", name: "Brazil" },
  HAD: { code: "fr", name: "France" },
  ANT: { code: "it", name: "Italy" },
  LIN: { code: "gb", name: "United Kingdom" }
};

// Default fallback team colors
const DEFAULT_TEAM_COLORS = {
  Ferrari: "ED1131",
  "Red Bull Racing": "4781D7",
  McLaren: "F47600",
  Mercedes: "00D7B6",
  "Aston Martin": "229971",
  Alpine: "00A1E8",
  Williams: "1868DB",
  "Racing Bulls": "6C98FF",
  "RB": "6C98FF",
  "Haas F1 Team": "B6BABD",
  Audi: "F50537",
  Cadillac: "909090",
  "Kick Sauber": "52E252"
};

const FALLBACK_AVATAR = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png";

// State Management
let allDriversList = [];
let driversByNumber = new Map();
let currentActiveAudio = null;
let currentActivePlayBtn = null;

// Helper to resolve nationality
function resolveDriverCountry(driver) {
  const acronym = (driver.name_acronym || "").toUpperCase();
  if (DRIVER_COUNTRY_MAP[acronym]) {
    return DRIVER_COUNTRY_MAP[acronym];
  }
  if (driver.country_code && driver.country_code.length === 2) {
    return { code: driver.country_code.toLowerCase(), name: driver.country_code.toUpperCase() };
  }
  return { code: "un", name: "International" };
}

// Format Time Helper
function formatTimeOnly(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return "-";
  }
}

// ---------------------------------------------------
// 1. DRIVER DATA & SEARCH / FILTER ENGINE
// ---------------------------------------------------

async function ambilDataPembalap() {
  const loadingEl = document.getElementById("loading-spinner");
  const gridEl = document.getElementById("drivers-grid");
  const tableWrapper = document.getElementById("table-wrapper");

  const kunciCache = "borkat_f1_drivers_v3";
  const waktuCache = "borkat_f1_drivers_time_v3";
  const satuJam = 3600000;

  try {
    const dataCache = localStorage.getItem(kunciCache);
    const waktuCacheSimpan = localStorage.getItem(waktuCache);
    const waktuSekarang = Date.now();

    if (dataCache && waktuCacheSimpan && waktuSekarang - parseInt(waktuCacheSimpan) < satuJam) {
      const parsedData = JSON.parse(dataCache);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        processDriversData(parsedData);
        return;
      }
    }

    let respons = await fetch("https://api.openf1.org/v1/drivers?session_key=latest");
    if (!respons.ok) {
      respons = await fetch("https://api.openf1.org/v1/drivers");
    }

    if (!respons.ok) {
      throw new Error(`OpenF1 Error: ${respons.status}`);
    }

    const data = await respons.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Data pembalap kosong dari API.");
    }

    localStorage.setItem(kunciCache, JSON.stringify(data));
    localStorage.setItem(waktuCache, waktuSekarang.toString());

    processDriversData(data);
  } catch (error) {
    console.error("Gagal memuat pembalap OpenF1:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: #ff6b6b; padding: 2rem; text-align: center;">
          <p style="font-size: 1.3rem; font-weight: bold; margin-bottom: 0.5rem;">⚠️ Gagal Memuat Data Pembalap</p>
          <p style="font-size: 1rem; color: #cbd5e1;">${error.message || "Periksa koneksi internet Anda."}</p>
          <button onclick="localStorage.clear(); location.reload();" style="margin-top: 1rem; padding: 8px 18px; background: #e10600; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Muat Ulang</button>
        </div>
      `;
    }
  }
}

function processDriversData(rawDrivers) {
  const driversMap = new Map();
  for (const item of rawDrivers) {
    const key = item.driver_number || item.full_name;
    if (key && !driversMap.has(key)) {
      driversMap.set(key, item);
      if (item.driver_number) {
        driversByNumber.set(item.driver_number, item);
      }
    }
  }

  allDriversList = Array.from(driversMap.values());
  allDriversList.sort((a, b) => (Number(a.driver_number) || 999) - (Number(b.driver_number) || 999));

  renderDriverCards(allDriversList);
  renderDriverTable(allDriversList);
  initFilterAndSearch();
  
  // Load supplementary live ecosystem widgets
  ambilDataCuaca();
  ambilTeamRadio();
}

function renderDriverCards(drivers) {
  const loadingEl = document.getElementById("loading-spinner");
  const gridEl = document.getElementById("drivers-grid");

  if (loadingEl) loadingEl.style.display = "none";
  if (!gridEl) return;

  gridEl.style.display = "grid";
  gridEl.innerHTML = "";

  if (drivers.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #94a3b8;">
        <p style="font-size: 1.4rem; font-weight: bold; margin-bottom: 0.5rem;">🏁 Tidak Ada Pembalap Ditemukan</p>
        <p style="font-size: 1rem;">Coba sesuaikan kata kunci pencarian atau pilih filter tim lain.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  drivers.forEach((driver) => {
    const country = resolveDriverCountry(driver);
    const teamColor = driver.team_colour ? `#${driver.team_colour}` : `#${DEFAULT_TEAM_COLORS[driver.team_name] || "e10600"}`;
    const headshot = driver.headshot_url || FALLBACK_AVATAR;
    const driverNumber = driver.driver_number || "-";
    const acronym = driver.name_acronym || driver.broadcast_name || "";
    const fullName = driver.full_name || `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || "F1 Driver";
    const teamName = driver.team_name || "Formula 1 Team";

    const card = document.createElement("div");
    card.className = "driver-card";
    card.style.setProperty("--team-color", teamColor);

    card.innerHTML = `
      <div class="card-accent" style="background: ${teamColor}"></div>
      <div class="card-top">
        <span class="driver-num">${driverNumber}</span>
        <div class="driver-country-badge" title="${country.name}">
          <img src="https://flagcdn.com/w40/${country.code}.png" alt="${country.name}" onerror="this.style.display='none'" />
          <span>${country.name}</span>
        </div>
      </div>
      <div class="card-image-box">
        <img src="${headshot}" alt="${fullName}" class="driver-photo" loading="lazy" onerror="this.src='${FALLBACK_AVATAR}'" />
      </div>
      <div class="card-info">
        <div class="driver-acronym-badge" style="border-color: ${teamColor}; color: ${teamColor}">${acronym}</div>
        <h3 class="driver-name">${fullName}</h3>
        <p class="driver-team" style="color: #cbd5e1">${teamName}</p>
      </div>
    `;

    fragment.appendChild(card);
  });

  gridEl.appendChild(fragment);
}

function renderDriverTable(drivers) {
  const tbth = document.querySelector(".table-head");
  const tbbd = document.querySelector(".table-body");
  const tableWrapper = document.getElementById("table-wrapper");

  if (!tbth || !tbbd) return;
  if (tableWrapper) tableWrapper.style.display = "block";

  tbth.innerHTML = `
    <tr>
      <th>Flag</th>
      <th>No</th>
      <th>Driver Name</th>
      <th>Team</th>
    </tr>
  `;

  tbbd.innerHTML = "";
  const fragment = document.createDocumentFragment();

  drivers.forEach((driver) => {
    const country = resolveDriverCountry(driver);
    const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#e10600";
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <img src="https://flagcdn.com/w40/${country.code}.png" alt="${country.name}" style="width: 24px; border-radius: 3px; vertical-align: middle;" onerror="this.style.display='none'" />
      </td>
      <td><strong style="color: ${teamColor}">${driver.driver_number || "-"}</strong></td>
      <td>${driver.full_name || "-"}</td>
      <td>${driver.team_name || "-"}</td>
    `;
    fragment.appendChild(row);
  });

  tbbd.appendChild(fragment);
}

function initFilterAndSearch() {
  const searchInput = document.getElementById("driver-search-input");
  const filterPills = document.querySelectorAll(".team-filter-pill");

  let activeTeam = "all";
  let currentQuery = "";

  function applyFilter() {
    const filtered = allDriversList.filter((driver) => {
      const nameMatch = (driver.full_name || "").toLowerCase().includes(currentQuery) ||
                        (driver.name_acronym || "").toLowerCase().includes(currentQuery) ||
                        String(driver.driver_number || "").includes(currentQuery);
      
      const teamMatch = activeTeam === "all" || (driver.team_name || "").toLowerCase().includes(activeTeam.toLowerCase());

      return nameMatch && teamMatch;
    });

    renderDriverCards(filtered);
    renderDriverTable(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      currentQuery = e.target.value.trim().toLowerCase();
      applyFilter();
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      filterPills.forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      activeTeam = pill.getAttribute("data-team") || "all";
      applyFilter();
    });
  });
}

// ---------------------------------------------------
// 2. LIVE CIRCUIT WEATHER & TRACK CONDITIONS
// ---------------------------------------------------

async function ambilDataCuaca() {
  const weatherContainer = document.getElementById("weather-widget-content");
  if (!weatherContainer) return;

  try {
    const res = await fetch("https://api.openf1.org/v1/weather?session_key=latest");
    if (!res.ok) throw new Error(`Weather error: ${res.status}`);

    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return;

    // Get the latest reading (last item in array)
    const latest = list[list.length - 1];

    const airTemp = latest.air_temperature !== null ? `${latest.air_temperature.toFixed(1)}°C` : "--";
    const trackTemp = latest.track_temperature !== null ? `${latest.track_temperature.toFixed(1)}°C` : "--";
    const humidity = latest.humidity !== null ? `${latest.humidity.toFixed(0)}%` : "--";
    const windSpeed = latest.wind_speed !== null ? `${latest.wind_speed.toFixed(1)} m/s` : "--";
    const isRain = latest.rainfall === 1;

    weatherContainer.innerHTML = `
      <div class="weather-card">
        <div class="weather-icon">🌡️</div>
        <div class="weather-data">
          <span class="weather-label">Track Temp</span>
          <strong class="weather-val" style="color: #ff5722">${trackTemp}</strong>
        </div>
      </div>
      <div class="weather-card">
        <div class="weather-icon">🌤️</div>
        <div class="weather-data">
          <span class="weather-label">Air Temp</span>
          <strong class="weather-val">${airTemp}</strong>
        </div>
      </div>
      <div class="weather-card">
        <div class="weather-icon">💧</div>
        <div class="weather-data">
          <span class="weather-label">Humidity</span>
          <strong class="weather-val">${humidity}</strong>
        </div>
      </div>
      <div class="weather-card">
        <div class="weather-icon">💨</div>
        <div class="weather-data">
          <span class="weather-label">Wind Speed</span>
          <strong class="weather-val">${windSpeed}</strong>
        </div>
      </div>
      <div class="weather-card weather-status-card">
        <div class="weather-icon">${isRain ? "🌧️" : "☀️"}</div>
        <div class="weather-data">
          <span class="weather-label">Track State</span>
          <strong class="weather-val" style="color: ${isRain ? '#38bdf8' : '#4ade80'}">${isRain ? "WET TRACK" : "DRY TRACK"}</strong>
        </div>
      </div>
    `;
  } catch (err) {
    console.warn("Cuaca OpenF1 tidak termuat:", err);
    if (weatherContainer) {
      weatherContainer.innerHTML = `<p style="color: #94a3b8; font-size: 0.9rem;">Data cuaca sirkuit sedang diperbarui...</p>`;
    }
  }
}

// ---------------------------------------------------
// 3. OFFICIAL TEAM RADIO AUDIO PLAYER HUB
// ---------------------------------------------------

async function ambilTeamRadio() {
  const radioGrid = document.getElementById("team-radio-grid");
  if (!radioGrid) return;

  try {
    const res = await fetch("https://api.openf1.org/v1/team_radio?session_key=latest");
    if (!res.ok) throw new Error(`Radio error: ${res.status}`);

    const radios = await res.json();
    if (!Array.isArray(radios) || radios.length === 0) {
      radioGrid.innerHTML = `<p style="color: #94a3b8; text-align: center; grid-column: 1 / -1;">Tidak ada rekaman radio aktif untuk sesi ini.</p>`;
      return;
    }

    // Take top 8 latest radio messages
    const recentRadios = radios.slice(-8).reverse();
    radioGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    recentRadios.forEach((item, idx) => {
      const driver = driversByNumber.get(item.driver_number) || {
        full_name: `Driver #${item.driver_number}`,
        name_acronym: `D${item.driver_number}`,
        team_name: "Formula 1 Team",
        team_colour: "e10600"
      };

      const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#e10600";
      const timeStr = formatTimeOnly(item.date);

      const card = document.createElement("div");
      card.className = "radio-card";
      card.style.setProperty("--team-color", teamColor);

      card.innerHTML = `
        <div class="radio-card-header">
          <div class="radio-driver-badge" style="background: ${teamColor}; color: #fff;">
            #${item.driver_number} ${driver.name_acronym || ""}
          </div>
          <span class="radio-timestamp">⏱️ ${timeStr}</span>
        </div>
        <div class="radio-driver-info">
          <h4 class="radio-driver-name">${driver.full_name}</h4>
          <span class="radio-team-name">${driver.team_name}</span>
        </div>
        <div class="radio-player-controls">
          <button class="radio-play-btn" data-audio="${item.recording_url}" aria-label="Play radio message">
            <span class="play-icon">▶</span>
          </button>
          <div class="radio-wave-bars">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
          <span class="radio-status-text">Official Pit Comms</span>
        </div>
      `;

      const playBtn = card.querySelector(".radio-play-btn");
      const waveBars = card.querySelector(".radio-wave-bars");
      const playIcon = card.querySelector(".play-icon");
      const audioUrl = item.recording_url;

      playBtn.addEventListener("click", function () {
        if (currentActivePlayBtn === playBtn && currentActiveAudio && !currentActiveAudio.paused) {
          // Pause current audio
          currentActiveAudio.pause();
          playIcon.textContent = "▶";
          waveBars.classList.remove("is-playing");
          return;
        }

        // Stop any previous audio
        if (currentActiveAudio) {
          currentActiveAudio.pause();
          currentActiveAudio.currentTime = 0;
          if (currentActivePlayBtn) {
            currentActivePlayBtn.querySelector(".play-icon").textContent = "▶";
            currentActivePlayBtn.closest(".radio-card")?.querySelector(".radio-wave-bars")?.classList.remove("is-playing");
          }
        }

        // Play new audio
        const audio = new Audio(audioUrl);
        currentActiveAudio = audio;
        currentActivePlayBtn = playBtn;

        playIcon.textContent = "⏸";
        waveBars.classList.add("is-playing");

        audio.play().catch((err) => {
          console.warn("Audio playback error:", err);
          playIcon.textContent = "▶";
          waveBars.classList.remove("is-playing");
        });

        audio.addEventListener("ended", function () {
          playIcon.textContent = "▶";
          waveBars.classList.remove("is-playing");
          currentActiveAudio = null;
          currentActivePlayBtn = null;
        });
      });

      fragment.appendChild(card);
    });

    radioGrid.appendChild(fragment);
  } catch (err) {
    console.warn("Team Radio OpenF1 gagal dimuat:", err);
    if (radioGrid) {
      radioGrid.innerHTML = `<p style="color: #94a3b8; text-align: center; grid-column: 1 / -1;">Rekaman Team Radio sedang dipersiapkan...</p>`;
    }
  }
}

// Global Initialization on DOM Ready
document.addEventListener("DOMContentLoaded", ambilDataPembalap);