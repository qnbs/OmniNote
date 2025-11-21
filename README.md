
# OmniNote 🧠✨

> **The Cognitive Operating System for the AI Era.**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge&color=0ea5e9)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge&color=22c55e)
![Status](https://img.shields.io/badge/status-Production_Ready-orange.svg?style=for-the-badge&color=f59e0b)

<div align="center">

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73C9D?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-bard&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)

</div>

---

## 📑 Table of Contents

- [🇬🇧 English Documentation](#-english-documentation)
  - [Philosophy](#-philosophy)
  - [Core Capabilities](#-core-capabilities)
  - [AI Agent Swarm Architecture](#-ai-agent-swarm-architecture)
  - [Technical Architecture](#-technical-architecture)
  - [Getting Started](#-getting-started)
  - [Keyboard Shortcuts](#-keyboard-shortcuts)
- [🇩🇪 Deutsche Dokumentation](#-deutsche-dokumentation)

---

<br />

# 🇬🇧 English Documentation

## 🔮 Philosophy

**OmniNote** is not merely a repository for text; it is a **Second Brain** engineered for the age of artificial intelligence. By fusing structured data management with a sophisticated force-directed knowledge graph and an orchestrated swarm of Large Language Model (LLM) agents, OmniNote transforms passive note-taking into active knowledge engineering.

Designed with a **Local-First** architecture, it ensures zero-latency interaction and complete data sovereignty, while surgically leveraging Cloud AI only when explicitly invoked by the user.

## ✨ Core Capabilities

### 📝 Structured Knowledge Engine
*   **Advanced Markdown Editor**: A robust writing environment supporting GFM (GitHub Flavored Markdown), syntax highlighting for code blocks, interactive task lists, and raw HTML support.
*   **Semantic Wiki-Linking**: Build a neural network of thoughts using `[[Double Bracket]]` syntax. The system auto-resolves titles case-insensitively, creating resilient connections between disparate ideas.
*   **Template Engine**: Define reusable schemas for Meetings, Journals, or Project Plans using the dedicated Template view.
*   **Smart Tasks**: An aggregated Task Dashboard that parses your notes for Markdown checkboxes (`- [ ]`) and metadata tags (`@{YYYY-MM-DD}`), organizing them into Overdue, Today, and Upcoming buckets.

### 🕸️ Dynamic Knowledge Graph
*   **Force-Directed Visualization**: Powered by **D3.js**, the graph view provides a physics-based representation of your knowledge base.
*   **Topological Analysis**: Nodes grow based on content density; links represent both explicit Wiki-Links (dashed) and implicit Tag connections (solid).
*   **Interactive Exploration**: Drag, zoom, and click nodes to traverse your digital brain.

### 🎨 Adaptive User Experience
*   **Glassmorphism UI**: A modern, translucent aesthetic with background blur effects.
*   **Tactile Feedback**: Micro-interactions and scale transformations on clicks provide a native-app feel.
*   **Accessibility First**: Comprehensive ARIA attributes, keyboard navigation support, and high-contrast focus rings.
*   **Command Palette**: A `Ctrl+K` power menu to navigate, toggle themes, or trigger AI agents instantly.

---

## 🤖 AI Agent Swarm Architecture

OmniNote leverages the **Google GenAI SDK** to orchestrate a suite of specialized agents. Unlike generic chatbots, these agents are "prompt-engineered" for specific cognitive tasks.

| Agent | Model | Function |
| :--- | :--- | :--- |
| **The Analyst** | `gemini-2.5-flash` | Performs semantic analysis to generate concise summaries and auto-extract taxonomy tags. |
| **The Creative** | `gemini-2.5-flash` | Uses high-temperature sampling to brainstorm lateral thinking ideas and divergent next steps. |
| **The Planner** | `gemini-2.5-flash` | Converts unstructured prose into structured, hierarchical action plans and Markdown checklists. |
| **The Researcher** | `gemini-2.5-flash` | **Grounding Enabled**. Queries Google Search to validate facts and find external citations. |
| **The Artist** | `gemini-2.5-flash-image` | Synthesizes visual representations of note concepts using varying styles (Photorealistic, Watercolor, Anime). |
| **The Linguist** | `gemini-2.5-flash` | Context-aware translation that preserves Markdown formatting and nuance. |
| **The Chatbot** | `gemini-2.5-flash` | A RAG-lite experience allowing you to converse specifically *with* the current note's context. |

### 🧪 AI Recipes
Recipes are pre-compiled, complex instruction chains that execute multi-step workflows:
*   **Blog Post**: Transforming bullet points into SEO-optimized articles.
*   **Meeting Analysis**: Extracting Action Items, Key Decisions, and sentiment from transcripts.
*   **Social Post**: Drafting platform-specific content with hashtag optimization.

---

## ⚙️ Technical Architecture

### Stack Composition
*   **Frontend**: React 19 (Concurrent Mode enabled)
*   **Language**: TypeScript 5.0 (Strict Mode)
*   **Build System**: Vite (ESBuild)
*   **Styling**: Tailwind CSS (JIT Compiler)
*   **State Management**: React Context API + `useReducer` for complex agent states.

### Data Persistence Strategy
OmniNote employs a **Local-Storage Strategy** with optimistic UI updates:
1.  **Atomicity**: Notes are serialized to JSON and stored in browser `localStorage`.
2.  **Debouncing**: Writes are debounced (500ms) to prevent I/O thrashing during rapid typing.
3.  **Import/Export**: Full JSON dump capabilities ensure data portability (GDPR compliant data freedom).

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** v18+
*   **Google AI Studio API Key** (Required for AI features)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/omninote.git
    cd omninote
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    The application injects the API key at runtime via the build process or environment variables.
    Create a `.env` file in the root:
    ```env
    API_KEY=your_google_gemini_api_key
    ```

4.  **Launch Development Server**
    ```bash
    npm run dev
    ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| `Ctrl/Cmd + K` | Open Command Palette | Global |
| `Ctrl/Cmd + N` | Create New Note | Global |
| `Ctrl/Cmd + Enter` | Toggle Edit/Preview Mode | Editor |
| `Ctrl/Cmd + B` | **Bold** | Editor |
| `Ctrl/Cmd + I` | *Italic* | Editor |
| `Esc` | Close Modals / Sidebar | Global |

---

<br />
<br />

# 🇩🇪 Deutsche Dokumentation

## 🏛️ Philosophie

**OmniNote** ist mehr als nur ein Ort zum Speichern von Text; es ist ein **Zweites Gehirn**, entwickelt für das KI-Zeitalter. Durch die Verschmelzung von strukturierter Datenverwaltung mit einem dynamischen Wissensgraphen und einem orchestrierten Schwarm von KI-Agenten verwandelt OmniNote passives Notieren in aktives Wissensmanagement.

Die **Local-First**-Architektur garantiert Souveränität über Ihre Daten und latenzfreie Interaktion, während leistungsstarke Cloud-KI nur dann chirurgisch eingesetzt wird, wenn Sie es explizit anfordern.

## ✨ Kernfunktionen

### 📝 Strukturierte Wissens-Engine
*   **Leistungsstarker Markdown-Editor**: Unterstützung für GFM, Syntax-Highlighting und interaktive Aufgabenlisten.
*   **Semantische Wiki-Links**: Vernetzen Sie Gedanken mit der `[[Link]]`-Syntax. Das System löst Titel intelligent auf und schafft resiliente Verbindungen.
*   **Vorlagen-Engine**: Definieren Sie wiederverwendbare Schemata für Meetings oder Tagebücher.
*   **Intelligentes Aufgaben-Dashboard**: Aggregiert Aufgaben (`- [ ]`) und Fälligkeitsdaten (`@{JJJJ-MM-TT}`) aus allen Notizen.

### 🕸️ Dynamischer Wissensgraph
*   **Force-Directed Visualization**: Eine physikbasierte Darstellung Ihres Wissensnetzes, angetrieben von **D3.js**.
*   **Topologische Analyse**: Knoten wachsen basierend auf der Inhaltsdichte; Verbindungen visualisieren explizite Links und implizite Tags.

### 🤖 KI-Agenten-Schwarm
OmniNote nutzt spezialisierte Agenten für kognitive Aufgaben:
*   **Der Analyst**: Erstellt Zusammenfassungen und extrahiert Taxonomien.
*   **Der Kreative**: Brainstorming für laterales Denken.
*   **Der Planer**: Konvertiert Prosa in strukturierte Aktionspläne.
*   **Der Forscher**: Nutzt **Google Search Grounding** für faktenbasierte Recherche.
*   **Der Künstler**: Generiert visuelle Konzepte (`gemini-2.5-flash-image`).

## 🚀 Erste Schritte

1.  **Repository klonen**: `git clone ...`
2.  **Abhängigkeiten installieren**: `npm install`
3.  **API-Key konfigurieren**: Erstellen Sie eine `.env` Datei mit `API_KEY=...`
4.  **Starten**: `npm run dev`

---

<div align="center">

**Built with passion by a Senior Frontend Engineer.**
<br>
*Empowering Thought via Silicon.*

</div>
