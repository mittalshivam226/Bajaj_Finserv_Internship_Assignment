# Bajaj_Finserv_Internship_Assignment
Internship Assignment by Bajaj Finserv

# SRM Full Stack Engineering Challenge — Node Hierarchy Explorer

A full-stack application that processes hierarchical node relationships and visualises tree structures with cycle detection.

## 🚀 Live

- **Frontend**: [Deployed URL]
- **API Endpoint**: `POST /bfhl`

## 📋 Features

- **Tree Construction** from parent→child edges
- **Cycle Detection** with visual indicators
- **Multi-tree** support — handles disconnected graphs
- **Invalid Input Handling** — validates format `X->Y` (uppercase A–Z, no self-loops)
- **Duplicate Edge Detection**
- **Interactive Tree Visualiser** — collapsible node hierarchy
- **Premium Dark-mode UI** — glassmorphism, grid background, micro-animations

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: JavaScript
- **Styling**: Custom CSS (dark theme, glassmorphism)
- **Fonts**: Inter + JetBrains Mono (Google Fonts)
- **Hosting**: Vercel

## 📡 API

### `POST /bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]
}
```

**Response:** Returns `user_id`, `email_id`, `college_roll_number`, `hierarchies` (tree objects), `invalid_entries`, `duplicate_edges`, and `summary`.

## 🏃 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👤 Author

- **Name**: Shivam Mittal
- **Email**: sm7465@srmist.edu.in
- **Roll**: RA2311003011700
