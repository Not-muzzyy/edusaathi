# EduSathi Advanced UI/UX and Custom SVGs Specification

Date: 2026-06-08
Topic: Custom SVGs, Ambient Background animations, Shimmer Buttons, 3D flips, and Drag-and-Drop Indexing

---

## 1. Goal & Background
To transition the EduSathi student workspace into a state-of-the-art, high-engagement academic companion. We are replacing generic emojis with curated SVG indicators, integrating premium CSS-animated background canvas visual layers, adding micro-interactions (laser border flows, button shimmers, 3D flips), and creating an animated drag-and-drop file indexing console.

---

## 2. Proposed UI/UX Features

### 2.1 Ambient Background Layer
* **Components:**
  - `DriftingBlobs`: Two glowing high-blur radial gradient circles in the background layer (`rgba(108, 99, 255, 0.08)` and `rgba(78, 205, 196, 0.06)`) transitioning slowly via CSS hardware-accelerated transforms (`translate3d` and `scale3d`).
  - `CyberGrid`: Repeating geometric grid overlay (`background-size: 24px 24px`) with low-opacity linear borders.
  - `ConstellationBackground`: A slow SVG network path displaying glowing nodes (representing connected lecture topics) and dashed links.

### 2.2 Glass Cards & Button Micro-Interactions
* **Laser Border Effect:** Card panels will feature a dynamic laser highlight effect. When focused or hovered, a neon gradient light flows along the card border.
* **Shimmer Buttons:** Core action buttons (such as starting quiz sessions, generating cards, and starting simulations) will feature a continuous, low-key shiny shimmer effect on hover.

### 2.3 Concentric Mastery Rings & 3D Badge Flips
* **Concentric progress rings:** Replacing basic horizontal bars on the progress page and dashboard widgets with custom SVG circular progress rings using dash-array offset math.
* **3D Badge Flips:** Streak milestone cards and achievements use CSS 3D transforms (`perspective: 1000px; transform-style: preserve-3d; transition: transform 0.6s;`). Hovering triggers a `rotateY(180deg)` flip to reveal requirements, unlocks, and rewards.
* **Streak Flame indicator:** Emojis are replaced by a glowing warm gradient vector flame SVG.

### 2.4 Drag-and-Drop Index Zone & Custom SVGs
* **Interactive Drop Zone:** Inside "Paper Analysis" and "Chat Tutor", files can be dragged directly onto a dotted zone that shifts border color and expands into a frosted upload state on hover.
* **Vector Line Icons:** Emojis are completely removed across all sidebar links, headers, and dashboard widgets, and replaced with clean, color-stroke SVGs.

---

## 3. Data Integration
* The UI elements hook directly into:
  - `TopicProgress` (concentric mastery ring calculation).
  - `QuizAttempt` (daily streak flame calculation).
  - `Documents` list (counting papers uploaded/indexed inside the drop zone).

---

## 4. Verification Plan
* **Build Verification:** Run Vite compiler build tool to check for syntax and TypeScript errors.
* **Visual Verification:** Check the page transitions and verify the hardware-accelerated animations run at 60fps.
