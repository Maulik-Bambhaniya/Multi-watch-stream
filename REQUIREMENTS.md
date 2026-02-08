# MultiStream - Multi-Platform Live Stream Viewer

## 📋 Project Overview

**MultiStream** is a web application that allows users to watch multiple live streams simultaneously in a single unified interface. Similar to multiwatch services, users can select streamers from various platforms and view them together in customizable layouts.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js (React) | Server-side rendering, routing, and UI |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Pre-built accessible component library |
| **Backend** | Golang (Go) | API server, business logic, stream aggregation |
| **Database** | PostgreSQL | User data, preferences, saved layouts |
| **Caching** | Redis | Session management, rate limiting |

---

## 🎯 Core Features

### 1. Platform Selection
- Users can select from supported streaming platforms
- **Supported Platforms:**
  - YouTube Live
  - Twitch
  - Kick

### 2. Streamer Search
- Search bar to find live streamers by:
  - Username/Channel name
  - Stream title
- Real-time search suggestions
- Filter by platform
- Display streamer thumbnail, title, and viewer count

### 3. Stream Selection
- Users can select **unlimited streamers** (no hard limit)
- Performance depends on user's hardware and internet bandwidth
- Selected streamers are displayed in a preview list
- Ability to remove selected streamers before starting
- Visual indication of selected streamers

### 4. Control Buttons

| Button | Functionality |
|--------|---------------|
| **Autoplay** | Toggle - Automatically plays all streams without user interaction |
| **Mute** | Toggle - Mutes/unmutes all streams simultaneously |
| **Chat** | Toggle - Shows/hides chat panels for supported platforms |
| **Start** | Initiates the multi-stream view experience |

---

## 🖥️ Multi-Stream Viewing Experience

### Fullscreen Mode
- Pressing **Start** automatically enters fullscreen mode
- Exit fullscreen with `ESC` key or dedicated button
- Smooth transition animation into fullscreen

### Stream Display
- Number of streams displayed matches user selection (unlimited)
- Each stream embedded using platform-specific embed players:
  - YouTube: YouTube IFrame API
  - Twitch: Twitch Embed API
  - Kick: Kick Embed Player

### Layout Management
- **Drag-and-drop** functionality to rearrange stream positions
- **Resize handles** to adjust individual stream sizes
- **Preset layouts:**
  - Equal grid (2x2, 3x2, etc.)
  - Picture-in-picture (1 large + small corners)
  - Horizontal split
  - Vertical split
  - Focus mode (1 main + sidebar)

### Aspect Ratio Preservation
- All streams maintain their **original aspect ratio** (16:9)
- Black bars (letterboxing/pillarboxing) applied if needed
- Aspect ratio preserved during layout changes and resizing

---

## 📐 UI/UX Requirements

### Landing Page
```
┌─────────────────────────────────────────────────┐
│              MultiStream Logo                    │
├─────────────────────────────────────────────────┤
│  [YouTube] [Twitch] [Kick]    ← Platform Tabs   │
├─────────────────────────────────────────────────┤
│  🔍 [Search streamers...]     ← Search Bar      │
├─────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 👤  │ │ 👤  │ │ 👤  │ │ 👤  │  ← Results    │
│  └─────┘ └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────────────┤
│  Selected Streams (3/5):                        │
│  [Stream1 ✕] [Stream2 ✕] [Stream3 ✕]           │
├─────────────────────────────────────────────────┤
│  ☐ Autoplay  ☐ Mute  ☐ Chat  [▶ START]         │
└─────────────────────────────────────────────────┘
```

### Multi-Stream View (4 Streams Example)
```
┌─────────────────────────────────────────────────┐
│ ┌───────────────────┐ ┌───────────────────┐     │
│ │                   │ │                   │     │
│ │    Stream 1       │ │    Stream 2       │     │
│ │                   │ │                   │     │
│ └───────────────────┘ └───────────────────┘     │
│ ┌───────────────────┐ ┌───────────────────┐     │
│ │                   │ │                   │     │
│ │    Stream 3       │ │    Stream 4       │     │
│ │                   │ │                   │     │
│ └───────────────────┘ └───────────────────┘     │
├─────────────────────────────────────────────────┤
│ [Layout] [Mute All] [Chat] [Exit Fullscreen]    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Backend API Endpoints

### Search API
```
GET /api/v1/search
Query Params:
  - platform: string (youtube|twitch|kick)
  - query: string
  - limit: int (default: 20)

Response:
{
  "streamers": [
    {
      "id": "string",
      "platform": "string",
      "username": "string",
      "displayName": "string",
      "thumbnail": "string",
      "title": "string",
      "viewerCount": int,
      "isLive": boolean
    }
  ]
}
```

### Stream Embed Info
```
GET /api/v1/stream/:platform/:streamerId

Response:
{
  "embedUrl": "string",
  "chatUrl": "string",
  "platform": "string",
  "streamerId": "string"
}
```

---

## 📁 Project Structure

```
multistream/
├── frontend/                    # Next.js Application
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing/Search page
│   │   └── watch/
│   │       └── page.tsx        # Multi-stream viewer
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── PlatformSelector.tsx
│   │   ├── SearchBar.tsx
│   │   ├── StreamerCard.tsx
│   │   ├── SelectedStreams.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── StreamGrid.tsx
│   │   ├── StreamPlayer.tsx
│   │   └── LayoutControls.tsx
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useFullscreen.ts
│   │   └── useStreamLayout.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── backend/                     # Golang API Server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── search.go
│   │   │   └── stream.go
│   │   ├── services/
│   │   │   ├── youtube.go
│   │   │   ├── twitch.go
│   │   │   └── kick.go
│   │   ├── models/
│   │   │   └── streamer.go
│   │   └── config/
│   │       └── config.go
│   ├── pkg/
│   │   └── platform/
│   │       ├── youtube.go
│   │       ├── twitch.go
│   │       └── kick.go
│   ├── go.mod
│   └── go.sum
│
├── docker-compose.yml
├── README.md
└── REQUIREMENTS.md
```

---

## 🔐 Platform API Requirements

### YouTube
- YouTube Data API v3
- API Key required
- OAuth 2.0 for chat access (optional)

### Twitch
- Twitch API (Helix)
- Client ID and Secret required
- OAuth for chat integration

### Kick
- Kick API (unofficial/web scraping as backup)
- May require reverse-engineering embed URLs

---

## 📋 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | User can select streaming platform | High |
| FR-02 | User can search for live streamers | High |
| FR-03 | User can select unlimited streamers | High |
| FR-04 | Autoplay toggle works across all streams | High |
| FR-05 | Mute toggle works across all streams | High |
| FR-06 | Chat toggle shows/hides chat panels | Medium |
| FR-07 | Start button initiates fullscreen view | High |
| FR-08 | Streams display in customizable grid | High |
| FR-09 | Users can resize individual streams | Medium |
| FR-10 | Users can drag-drop to rearrange streams | Medium |
| FR-11 | Aspect ratio preserved on resize | High |
| FR-12 | Exit fullscreen via ESC or button | High |

---

## 🚀 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time | < 2 seconds |
| NFR-02 | Search response time | < 500ms |
| NFR-03 | Stream embed load time | < 3 seconds |
| NFR-04 | Concurrent streams supported | Unlimited (hardware dependent) |
| NFR-05 | Browser support | Chrome, Firefox, Safari, Edge |
| NFR-06 | Mobile responsive | Tablet and above |
| NFR-07 | API rate limiting | 100 requests/min per IP |

---

## 🎨 Design Guidelines

### Color Palette
- **Primary:** Deep purple (#7C3AED)
- **Secondary:** Cyan (#06B6D4)
- **Background:** Dark gray (#0F172A)
- **Surface:** Slate (#1E293B)
- **Text:** White (#FFFFFF) / Gray (#94A3B8)

### Typography
- **Headings:** Inter (Bold)
- **Body:** Inter (Regular)
- **Monospace:** JetBrains Mono (code/stats)

### Components (shadcn/ui)
- Button, Input, Card, Dialog
- Tabs, Toggle, Slider
- Tooltip, Dropdown Menu
- Sheet (mobile navigation)

---

## 📅 Future Enhancements (Phase 2)

- [ ] User accounts and saved layouts
- [ ] Custom themes
- [ ] Picture-in-picture mode
- [ ] Sync playback across VODs
- [ ] Audio mixer for individual stream volumes
- [ ] Stream recording/clipping
- [ ] Additional platforms (Facebook Gaming, Rumble)
- [ ] Mobile app (React Native)
- [ ] Browser extension

---

## ⚠️ Known Limitations

1. **Kick API:** No official API; may require web scraping
2. **Chat Integration:** Platform-dependent capabilities
3. **Mobile:** Multi-stream viewing limited on mobile devices
4. **Bandwidth:** Multiple HD streams require high bandwidth

---

## 📝 Notes

- All platform embed players must respect their respective Terms of Service
- CORS handling required for cross-platform API calls
- WebSocket connections needed for real-time chat integration
- Consider CDN for static assets and caching

---

*Document Version: 1.0*  
*Last Updated: February 8, 2026*
