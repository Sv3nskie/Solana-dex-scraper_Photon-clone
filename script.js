// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")
    if (id && id.length > 1) {
      e.preventDefault()
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })
})

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("show")
        // Count up stats once visible
        if (entry.target.classList.contains("stats")) initCountUp(entry.target)
        io.unobserve(entry.target)
      }
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
)

document.querySelectorAll(".reveal").forEach((el) => io.observe(el))

// Count-up numbers
function initCountUp(root) {
  const items = root.querySelectorAll("[data-countup]")
  const duration = 1000

  items.forEach((el) => {
    const target = Number.parseFloat(el.dataset.countup || "0")
    const suffix = el.dataset.suffix || ""
    const start = performance.now()

    function tick(now) {
      const p = Math.min(1, (now - start) / duration)
      const val = Math.floor(p * target)
      el.textContent = `${val}${suffix}`
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

// Footer year
document.getElementById("year").textContent = new Date().getFullYear()

// Copy email
const email = "hello@example.com"
const copyBtn = document.getElementById("copyEmailBtn")
const copyStatus = document.getElementById("copyStatus")
copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(email)
    copyStatus.textContent = "Email copied to clipboard."
  } catch {
    copyStatus.textContent = "Unable to copy. Use the Email button instead."
  }
  setTimeout(() => (copyStatus.textContent = ""), 2400)
})

// Charts: latency (line) + coverage (bar)
let latencyChart, coverageChart

function initCharts() {
  const latCtx = document.getElementById("latencyChart").getContext("2d")
  const covCtx = document.getElementById("coverageChart").getContext("2d")

  // Chart theme colors from CSS variables
  const cs = getComputedStyle(document.documentElement)
  const fg = cs.getPropertyValue("--fg-100").trim() || "#e6e7eb"
  const grid = cs.getPropertyValue("--border").trim() || "#1f2630"
  const orange = cs.getPropertyValue("--accent").trim() || "#ff7a1a"
  const mint = cs.getPropertyValue("--mint").trim() || "#2ef2b8"

  // Latency chart (simulated realtime)
  const initLabels = Array.from({ length: 20 }, (_, i) => `${i + 1}s`)
  const initData = Array.from({ length: 20 }, () => randLatency())

  latencyChart = new window.Chart(latCtx, {
    type: "line",
    data: {
      labels: initLabels,
      datasets: [
        {
          label: "Block Parse Time (ms)",
          data: initData,
          borderColor: orange,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          fill: true,
          backgroundColor: withAlpha(orange, 0.08),
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 600 },
      scales: {
        x: { grid: { color: grid }, ticks: { color: fg } },
        y: { grid: { color: grid }, ticks: { color: fg }, suggestedMin: 30, suggestedMax: 70 },
      },
      plugins: {
        legend: { labels: { color: fg } },
        tooltip: { intersect: false, mode: "index" },
      },
    },
  })

  // Update latency every second
  let t = initLabels.length
  setInterval(() => {
    latencyChart.data.labels.push(`${++t}s`)
    latencyChart.data.datasets[0].data.push(randLatency())
    if (latencyChart.data.labels.length > 40) {
      latencyChart.data.labels.shift()
      latencyChart.data.datasets[0].data.shift()
    }
    latencyChart.update("none")
  }, 1000)

  // Coverage chart
  coverageChart = new window.Chart(covCtx, {
    type: "bar",
    data: {
      labels: ["Raydium", "Pump.fun", "Orca", "Meteora"],
      datasets: [
        {
          label: "Pools / Integrations Tracked",
          data: [4, 5, 1, 2], // AMM/CPMM/CLMM etc. simplified counts
          backgroundColor: [orange, orange, mint, mint].map((c) => withAlpha(c, 0.3)),
          borderColor: [orange, orange, mint, mint],
          borderWidth: 2,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { grid: { display: false }, ticks: { color: fg } },
        y: { grid: { color: grid }, ticks: { color: fg }, suggestedMax: 5 },
      },
      plugins: {
        legend: { labels: { color: fg } },
        tooltip: { intersect: false, mode: "index" },
      },
    },
  })
}

function randLatency() {
  // keep around ~55ms with a bit of jitter
  return Math.max(35, Math.min(70, 55 + (Math.random() - 0.5) * 18))
}

function withAlpha(hex, alpha) {
  // convert hex to rgba string
  const h = hex.replace("#", "")
  const bigint = Number.parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Preview images: load from data-src or URL query overrides
function initPreviewImages() {
  const params = new URLSearchParams(location.search)
  const map = [
    { id: "newPairImg", q: "newPairImg" },
    { id: "pairDataImg", q: "pairDataImg" },
  ]

  for (const { id, q } of map) {
    const img = document.getElementById(id)
    if (!img) continue

    // URL priority: ?queryParam=... -> data-src attribute -> no load
    const override = params.get(q)
    const candidate = override || img.getAttribute("data-src") || ""

    if (!candidate) continue

    const wrapper = img.closest(".preview-media")
    // Debug logs can be enabled if needed:
    // console.log("[v0] Loading preview image", { id, candidate })

    img.addEventListener("load", () => {
      wrapper?.classList.add("is-loaded")
    })
    img.addEventListener("error", () => {
      // Optional: keep skeleton if image fails
      // console.log("[v0] Failed to load image", { id, candidate })
    })
    img.src = candidate
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initPreviewImages()
  initCharts()
})
