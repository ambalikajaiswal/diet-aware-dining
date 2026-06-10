# 🍽️ Dietary Maps AI

A multi-agent AI system that discovers restaurants matching complex dietary needs using **real-time OpenStreetMap data** — no API keys required. Built with Next.js, React, and a pipeline of 7 specialized agents.

> "Halal food with gluten-free options near USC" → Real restaurants, confidence-scored, with Google Maps directions.

---

## ✨ Features

- **Natural Language Search** — Describe dietary needs in plain English (e.g., "vegan sushi near downtown")
- **Real-Time Data** — Fetches live restaurant data from OpenStreetMap via Overpass API
- **Multi-Agent Pipeline** — 7 specialized agents handle parsing, discovery, verification, scoring, and ranking
- **Confidence Scoring** — Each result shows a transparency score based on evidence strength
- **Source Verification** — Every result links back to its OpenStreetMap source for independent verification
- **Google Maps Navigation** — One-click directions to any restaurant
- **Responsive UI** — Full desktop layout with side-by-side map + results, mobile-first design
- **No API Keys** — All external services are free and open (Nominatim, Overpass, OSM)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                       │
│  Next.js Frontend • React • Zustand • Tailwind CSS      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ SearchForm  │→ │ ResultsMapView│→ │ Sources Tab   │  │
│  │ (NL input)  │  │ + RecCard    │  │ (OSM verify)  │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │ POST /api/recommend
┌────────────────────────────▼────────────────────────────┐
│  Next.js Server (API Routes)                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  AgentPipeline Orchestrator (pipeline.ts)          │ │
│  │                                                    │ │
│  │  1. DietaryIntentAgent    → Parse NL to intent     │ │
│  │  2. ClarificationAgent   → Ask if ambiguous       │ │
│  │  3. RestaurantDiscovery   → Query Overpass API     │ │
│  │  4. EvidenceVerification  → Verify dietary tags    │ │
│  │  5. TrustConfidence       → Score confidence       │ │
│  │  6. MapGeneration         → Compute map bounds     │ │
│  │  7. Recommendation        → Rank & compile         │ │
│  │  8. Export                 → Format JSON/CSV        │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  External Services (Free, No API Key)                   │
│  • Nominatim — Geocodes location text → lat/lng         │
│  • Overpass API — Queries OSM for restaurants           │
│  • OpenStreetMap — 10M+ contributor database            │
│  • Google Maps — Directions link (client-side only)     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/ambalikajaiswal/diet-aware-dining.git
cd diet-aware-dining
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── agents/                          # Multi-agent pipeline
│   ├── pipeline.ts                  # Orchestrator - coordinates all agents
│   ├── dietary-intent-agent.ts      # Parses NL query → structured intent
│   ├── clarification-agent.ts       # Asks follow-up if location ambiguous
│   ├── restaurant-discovery-agent.ts # Queries Overpass API for real restaurants
│   ├── evidence-verification-agent.ts # Verifies dietary claims via OSM tags
│   ├── trust-confidence-agent.ts    # Scores confidence per restaurant
│   ├── map-generation-agent.ts      # Generates map bounds & markers
│   ├── recommendation-agent.ts      # Ranks results, generates match reasons
│   └── export-agent.ts             # Exports results as JSON/CSV/text
├── app/
│   ├── api/
│   │   ├── recommend/route.ts       # POST - main search endpoint
│   │   └── clarify/route.ts         # POST - handle clarification answers
│   ├── page.tsx                     # Main page with routing & state
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Tailwind + Noto Sans font
├── components/
│   ├── LandingPage.tsx              # Hero, how-it-works, trust section
│   ├── SearchForm.tsx               # NL input, quick filters, prompts
│   ├── InterpretationView.tsx       # Agent processing animation
│   ├── ResultsMapView.tsx           # Map + sorted result cards
│   ├── RecommendationCard.tsx       # Restaurant card with sources dropdown
│   ├── RestaurantDetails.tsx        # Full restaurant detail view
│   ├── EvidenceView.tsx             # Evidence breakdown per restaurant
│   ├── ClarificationDialog.tsx      # Follow-up question UI
│   ├── SavedRecentView.tsx          # Saved restaurants + search history
│   └── Navigation.tsx               # Bottom nav (mobile) + top nav (desktop)
├── store/
│   └── index.ts                     # Zustand store (persisted saves/recents)
└── types/
    └── index.ts                     # TypeScript interfaces for all entities
```

---

## 🔄 Agent Pipeline Flow

1. **DietaryIntentAgent** — Extracts dietary needs, allergies, cuisine, location, price range, and meal type from natural language using keyword matching and regex patterns.

2. **ClarificationAgent** — If the location is missing or vague (e.g., "near me"), generates follow-up questions for the user.

3. **RestaurantDiscoveryAgent** — Geocodes the location via Nominatim, then queries the Overpass API for restaurants/cafes within a radius. Implements constraint relaxation (expanding radius from 2km → 4km → 6km) if too few results.

4. **EvidenceVerificationAgent** — Checks each restaurant's dietary claims against OSM tags (`diet:vegan`, `diet:halal`, etc.) and scores data completeness.

5. **TrustConfidenceAgent** — Computes an overall confidence score per restaurant based on evidence strength, review count proxy, menu verification, and data recency.

6. **MapGenerationAgent** — Calculates map center, bounds, zoom level, and generates marker data with Google Maps URLs.

7. **RecommendationAgent** — Compiles final ranked list with match reasons and warnings.

8. **ExportAgent** — Formats results into JSON, plain text, or CSV for sharing/export.

---

## 🗺️ Data Sources

| Source | What it provides | Cost |
|--------|-----------------|------|
| [OpenStreetMap](https://www.openstreetmap.org) | Restaurant locations, names, addresses, cuisine types, dietary tags | Free |
| [Nominatim](https://nominatim.openstreetmap.org) | Geocoding (city name → lat/lng coordinates) | Free |
| [Overpass API](https://overpass-api.de) | Query engine for OSM data (find restaurants within radius) | Free |
| Google Maps | Directions link (client-side, no API key needed) | Free |

### How OSM Dietary Tags Work

OpenStreetMap uses community-verified tags like:
- `diet:vegan=yes` / `diet:vegan=only`
- `diet:vegetarian=yes`
- `diet:gluten_free=yes`
- `diet:halal=yes`
- `diet:kosher=yes`
- `diet:lactose_free=yes`

These are added by local mappers who verify the information in person. [Learn more →](https://wiki.openstreetmap.org/wiki/Key:diet)

---

## 🎨 Design

The UI follows the "Dietary Maps AI" prototype from the Miro board (Trojans team):

- **Primary color:** Green (#22c55e) — trust, health, nature
- **Font:** Noto Sans (Google Fonts)
- **Layout:** Responsive — mobile-first with full desktop expansion
- **Components:** Rounded cards, confidence badges, expandable source panels
- **Navigation:** Bottom bar on mobile, horizontal nav on desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| State | Zustand (persisted) |
| Language | TypeScript |
| Data | OpenStreetMap (Overpass API + Nominatim) |
| Architecture | Multi-agent pipeline (7 agents) |
| Deployment | Static + Serverless API routes |

---

## 📝 Example Queries

- `"Vegan sushi spot with high-protein options near Downtown LA"`
- `"Late-night halal burgers in Santa Monica, gluten-free buns available"`
- `"Nut-free dessert places within 5 miles of Seattle"`
- `"Jain-friendly Indian restaurant open on Sundays in Los Angeles"`
- `"Keto-friendly Korean BBQ near Venice Beach"`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'feat: add my feature'`)
4. Push to branch (`git push -u origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org) contributors for the restaurant data
- [Overpass API](https://overpass-api.de) for the free query engine
- Miro + Kiro for design-to-code workflow
- Built at Hackathon 2026 by Team Trojans
