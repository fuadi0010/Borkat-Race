// BORKATRACE - DRIVERS API & DATA PROCESSOR (OpenF1 Integration)

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

// Fallback driver silhouette avatar
const FALLBACK_AVATAR = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png";

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

// Fetch driver data with localStorage cache
async function ambilDataPembalap() {
  const loadingEl = document.getElementById("loading-spinner");
  const gridEl = document.getElementById("drivers-grid");
  const tableWrapper = document.getElementById("table-wrapper");

  const kunciCache = "borkat_f1_drivers_cache_v2";
  const waktuCache = "borkat_f1_drivers_time_v2";
  const satuJam = 3600000; // 1 jam

  try {
    const dataCache = localStorage.getItem(kunciCache);
    const waktuCacheSimpan = localStorage.getItem(waktuCache);
    const waktuSekarang = Date.now();

    if (dataCache && waktuCacheSimpan && waktuSekarang - parseInt(waktuCacheSimpan) < satuJam) {
      const parsedData = JSON.parse(dataCache);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        renderDrivers(parsedData);
        return;
      }
    }

    // Try fetching latest session drivers
    let respons = await fetch("https://api.openf1.org/v1/drivers?session_key=latest");
    if (!respons.ok) {
      respons = await fetch("https://api.openf1.org/v1/drivers");
    }

    if (!respons.ok) {
      throw new Error(`OpenF1 API Error: ${respons.status}`);
    }

    const data = await respons.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Data pembalap kosong dari API.");
    }

    // Cache valid response
    localStorage.setItem(kunciCache, JSON.stringify(data));
    localStorage.setItem(waktuCache, waktuSekarang.toString());

    renderDrivers(data);
  } catch (error) {
    console.error("Gagal memuat data OpenF1:", error);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: #ff6b6b; padding: 2rem; text-align: center;">
          <p style="font-size: 1.4rem; font-weight: bold; margin-bottom: 0.5rem;">⚠️ Gagal Memuat Data OpenF1</p>
          <p style="font-size: 1rem; color: #ccc;">${error.message || "Periksa koneksi internet Anda."}</p>
          <button onclick="localStorage.clear(); location.reload();" style="margin-top: 1rem; padding: 8px 16px; background: #e10600; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Muat Ulang</button>
        </div>
      `;
    }
  }
}

// Process and render driver cards & table
function renderDrivers(rawDrivers) {
  const loadingEl = document.getElementById("loading-spinner");
  const gridEl = document.getElementById("drivers-grid");
  const tbth = document.querySelector(".table-head");
  const tbbd = document.querySelector(".table-body");
  const tableWrapper = document.getElementById("table-wrapper");

  if (loadingEl) loadingEl.style.display = "none";
  if (gridEl) gridEl.style.display = "grid";
  if (tableWrapper) tableWrapper.style.display = "block";

  // Deduplicate drivers by driver_number or full_name
  const driversMap = new Map();
  for (const item of rawDrivers) {
    const key = item.driver_number || item.full_name;
    if (key && !driversMap.has(key)) {
      driversMap.set(key, item);
    }
  }

  const uniqueDrivers = Array.from(driversMap.values());
  // Sort by driver number if available
  uniqueDrivers.sort((a, b) => (Number(a.driver_number) || 999) - (Number(b.driver_number) || 999));

  // 1. Render Grid Cards
  if (gridEl) {
    gridEl.innerHTML = "";
    const cardFragment = document.createDocumentFragment();

    uniqueDrivers.forEach((driver) => {
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
          <p class="driver-team" style="color: #ddd">${teamName}</p>
        </div>
      `;

      cardFragment.appendChild(card);
    });

    gridEl.appendChild(cardFragment);
  }

  // 2. Render Compatibility Table
  if (tbth && tbbd) {
    tbth.innerHTML = `
      <tr>
        <th>Flag</th>
        <th>No</th>
        <th>Driver Name</th>
        <th>Team</th>
      </tr>
    `;

    tbbd.innerHTML = "";
    const tableFragment = document.createDocumentFragment();

    uniqueDrivers.forEach((driver) => {
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
      tableFragment.appendChild(row);
    });

    tbbd.appendChild(tableFragment);
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", ambilDataPembalap);