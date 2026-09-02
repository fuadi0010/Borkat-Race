// ===================================================
// BORKATRACE - LIVE FORMULA 1 NEWS & RACE BULLETINS
// ===================================================

const CURATED_BACKUP_NEWS = [
  {
    title: "Mercedes rules out ADUO engine upgrade at Italian GP as updated F1 power unit due in October",
    pubDate: "2026-09-02T14:43:35Z",
    link: "https://www.formula1.com/en/latest",
    author: "Technical Analysis",
    category: "Technical",
    thumbnail: "../IMG/redbull-racing-4k.webp",
    description: "Mercedes has confirmed that Kimi Antonelli won't race with an updated power unit at this weekend's Italian Grand Prix, with their next major aero and powertrain iteration slated for autumn."
  },
  {
    title: "Ferrari confirms it will introduce second major aero & power upgrade at Monza",
    pubDate: "2026-09-02T12:52:39Z",
    link: "https://www.formula1.com/en/latest",
    author: "F1 Editorial",
    category: "Technical",
    thumbnail: "../IMG/driver.webp",
    description: "Ferrari will introduce its second upgrade to its Formula 1 power unit at Monza, aiming to optimize top-speed efficiency on the Temple of Speed's iconic straights."
  },
  {
    title: "Did McLaren handle Piastri-Norris fight fairly? Our in-depth tactical verdict",
    pubDate: "2026-09-01T16:20:00Z",
    link: "https://www.formula1.com/en/latest",
    author: "Race Strategy",
    category: "Strategy",
    thumbnail: "../IMG/meclarennews.jpg",
    description: "The McLaren drivers' eventual split-strategy made for a gripping finish. We analyze the radio transcripts and tire degradation data that decided the Grand Prix outcome."
  },
  {
    title: "Oscar Piastri reflects on Hungarian GP podium and McLaren Championship charge",
    pubDate: "2026-08-30T10:15:00Z",
    link: "https://www.formula1.com/en/latest",
    author: "Grand Prix Review",
    category: "Drivers",
    thumbnail: "../IMG/piastri.jpg",
    description: "Oscar Piastri breaks down the critical decisions made from the cockpit and how McLaren's aggressive aerodynamic package has closed the gap to the front."
  },
  {
    title: "Red Bull Technical Deep Dive: How the RB21 floor geometry maximizes ground effect",
    pubDate: "2026-08-28T08:30:00Z",
    link: "https://www.formula1.com/en/latest",
    author: "Aerodynamics Lab",
    category: "Technical",
    thumbnail: "../IMG/redbull-racing-4k.webp",
    description: "An exclusive look into the aerodynamic venturi tunnels and floor edge vortex generators powering Max Verstappen's title defense in high-speed corners."
  },
  {
    title: "Adrian Newey's next chapter and Aston Martin's wind tunnel state-of-the-art facility",
    pubDate: "2026-08-25T11:45:00Z",
    link: "https://www.formula1.com/en/latest",
    author: "Paddock Insider",
    category: "Paddock",
    thumbnail: "../IMG/driver.webp",
    description: "With cutting-edge simulator tech and wind tunnel calibration underway at Silverstone, Aston Martin prepares for the new Formula 1 regulatory revolution."
  }
];

let allNewsArticles = [];

// Helper: Format Date
function formatNewsDate(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently Updated";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (e) {
    return "Recently";
  }
}

// Strip HTML tags from description
function cleanHtmlSnippet(html, maxLen = 140) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const txt = tmp.textContent || tmp.innerText || "";
  return txt.length > maxLen ? txt.substring(0, maxLen).trim() + "..." : txt;
}

// ---------------------------------------------------
// 1. LIVE FIA RACE CONTROL BULLETINS
// ---------------------------------------------------
async function fetchRaceControlBulletins() {
  const tickerContainer = document.getElementById("race-control-ticker");
  if (!tickerContainer) return;

  try {
    const res = await fetch("https://api.openf1.org/v1/race_control?session_key=latest");
    if (!res.ok) throw new Error("Race control feed unreachable");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      tickerContainer.innerHTML = `<span class="ticker-item">🟢 TRACK STATUS: ALL SECTORS CLEAR - GREEN FLAG</span>`;
      return;
    }

    // Get the latest 5 messages
    const recent = data.slice(-5).reverse();
    const tickerItems = recent.map((item) => {
      const flagColor = (item.flag || "").toUpperCase();
      let icon = "📢";
      if (flagColor.includes("YELLOW")) icon = "🟨";
      else if (flagColor.includes("RED")) icon = "🟥";
      else if (flagColor.includes("GREEN") || flagColor.includes("CLEAR")) icon = "🟩";
      else if (item.category === "SafetyCar") icon = "🚗";

      return `<span class="ticker-item"><strong class="ticker-badge">${icon} ${item.category || "FIA"}</strong> ${item.message || "Track Bulletin"}</span>`;
    });

    tickerContainer.innerHTML = tickerItems.join(' <span class="ticker-divider">•</span> ');
  } catch (err) {
    console.warn("Race Control ticker fallback:", err);
    if (tickerContainer) {
      tickerContainer.innerHTML = `<span class="ticker-item">🟢 TRACK STATUS: LIVE SESSIONS ACTIVE & MONITORED</span>`;
    }
  }
}

// ---------------------------------------------------
// 2. LIVE MOTORSPORT NEWS API (WITH SMART FALLBACK)
// ---------------------------------------------------
async function fetchLiveF1News() {
  const loadingEl = document.getElementById("news-loading");
  const featuredEl = document.getElementById("featured-news-container");
  const gridEl = document.getElementById("news-grid-container");

  const newsCacheKey = "borkat_live_f1_news_v1";
  const newsCacheTimeKey = "borkat_live_f1_news_time_v1";
  const cacheDuration = 1800000; // 30 minutes

  try {
    const cachedData = localStorage.getItem(newsCacheKey);
    const cachedTime = localStorage.getItem(newsCacheTimeKey);
    const now = Date.now();

    if (cachedData && cachedTime && now - parseInt(cachedTime) < cacheDuration) {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processNewsArticles(parsed);
        return;
      }
    }

    const apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=https://www.motorsport.com/rss/f1/news/";
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("API News response not OK");

    const data = await res.json();
    if (data.status === "ok" && Array.isArray(data.items) && data.items.length > 0) {
      const mapped = data.items.map((item, idx) => {
        let thumb = item.enclosure?.link || item.thumbnail;
        if (!thumb || thumb.includes("default")) {
          thumb = idx % 2 === 0 ? "../IMG/redbull-racing-4k.webp" : "../IMG/meclarennews.jpg";
        }
        return {
          title: item.title,
          pubDate: item.pubDate,
          link: item.link,
          author: item.author || "Motorsport Wire",
          category: (item.categories && item.categories[0]) || "Grand Prix",
          thumbnail: thumb,
          description: cleanHtmlSnippet(item.description, 160)
        };
      });

      localStorage.setItem(newsCacheKey, JSON.stringify(mapped));
      localStorage.setItem(newsCacheTimeKey, now.toString());

      processNewsArticles(mapped);
    } else {
      throw new Error("Invalid API format");
    }
  } catch (err) {
    console.warn("Live API news unavailable, using curated F1 archive:", err);
    processNewsArticles(CURATED_BACKUP_NEWS);
  }
}

function processNewsArticles(articles) {
  allNewsArticles = articles;
  const loadingEl = document.getElementById("news-loading");
  if (loadingEl) loadingEl.style.display = "none";

  renderNewsLayout(allNewsArticles);
  initNewsFilters();
}

function renderNewsLayout(articles) {
  const featuredEl = document.getElementById("featured-news-container");
  const gridEl = document.getElementById("news-grid-container");

  if (!articles || articles.length === 0) {
    if (gridEl) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #94a3b8;">
          <h3>🏁 No news articles found</h3>
          <p>Try clearing your search or choosing another category.</p>
        </div>
      `;
    }
    return;
  }

  // 1. Render Featured Lead Article (First item)
  if (featuredEl && articles.length > 0) {
    const feat = articles[0];
    featuredEl.innerHTML = `
      <article class="featured-article-card">
        <div class="featured-img-wrap">
          <img src="${feat.thumbnail}" alt="${feat.title}" loading="lazy" onerror="this.src='../IMG/meclarennews.jpg'" />
          <span class="featured-tag">🔥 BREAKING STORY</span>
        </div>
        <div class="featured-content">
          <div class="article-meta">
            <span class="meta-category">${feat.category}</span>
            <span class="meta-date">📅 ${formatNewsDate(feat.pubDate)}</span>
          </div>
          <h2 class="featured-title">
            <a href="${feat.link}" target="_blank" rel="noopener noreferrer">${feat.title}</a>
          </h2>
          <p class="featured-desc">${feat.description}</p>
          <div class="featured-footer">
            <span class="article-author">✍️ ${feat.author}</span>
            <a href="${feat.link}" target="_blank" rel="noopener noreferrer" class="read-more-btn">Read Full Story →</a>
          </div>
        </div>
      </article>
    `;
  }

  // 2. Render Secondary Stories in Grid (Remaining items)
  if (gridEl) {
    const gridArticles = articles.slice(1);
    if (gridArticles.length === 0) {
      gridEl.innerHTML = "";
      return;
    }

    const fragment = document.createDocumentFragment();

    gridArticles.forEach((item) => {
      const card = document.createElement("article");
      card.className = "news-grid-card";

      card.innerHTML = `
        <div class="grid-card-media">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" onerror="this.src='../IMG/redbull-racing-4k.webp'" />
          <span class="grid-card-badge">${item.category}</span>
        </div>
        <div class="grid-card-body">
          <div class="grid-card-meta">
            <span>📅 ${formatNewsDate(item.pubDate)}</span>
            <span>⏱️ 3 min read</span>
          </div>
          <h3 class="grid-card-title">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
          </h3>
          <p class="grid-card-desc">${item.description}</p>
          <div class="grid-card-footer">
            <span class="grid-card-author">${item.author}</span>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="grid-card-link">Read Story →</a>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    gridEl.innerHTML = "";
    gridEl.appendChild(fragment);
  }
}

function initNewsFilters() {
  const searchInput = document.getElementById("news-search-input");
  const filterPills = document.querySelectorAll(".news-filter-pill");

  let activeCategory = "all";
  let currentSearch = "";

  function applyNewsFilter() {
    const filtered = allNewsArticles.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(currentSearch) ||
                         (item.description || "").toLowerCase().includes(currentSearch);
      
      const catMatch = activeCategory === "all" || (item.category || "").toLowerCase().includes(activeCategory.toLowerCase());

      return titleMatch && catMatch;
    });

    renderNewsLayout(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      currentSearch = e.target.value.trim().toLowerCase();
      applyNewsFilter();
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      filterPills.forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      activeCategory = pill.getAttribute("data-category") || "all";
      applyNewsFilter();
    });
  });
}

// Global Init
document.addEventListener("DOMContentLoaded", function () {
  fetchRaceControlBulletins();
  fetchLiveF1News();
});
