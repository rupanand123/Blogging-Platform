# The Column — Modern Editorial Blogging Platform

Welcome to **The Column** (Vantage Journal), a high-contrast full-stack blogging platform. Crafted with a premium **Sophisticated Dark Theme**, it blends a minimalistic dark backdrop with warm, eye-safe amber accents and elegant typography hierarchy. It focuses on digital craftsmanship, clean editorial flows, and interactive reader discussion.

## 🎨 Design Concept

- **Sophisticated Dark Theme**: Rooted in deep slate tones (`#0a0a0b`) and structured borders (`#1f1f23`), paired with refined golden-amber highlight elements.
- **Classic Typography**: Standard technical and editorial font pairings, with responsive, fluid micro-transitions powered by `motion/react`.
- **Architectural Honesty**: Clean cards, straightforward buttons, zero unnecessary clutter, and layout alignments inspired by Swiss modernism.

---

## 🚀 Key Features

1. **User Authentication & Session Management**:
   - Register a columnist identity or sign in securely.
   - Credentials are encrypted on the server with secure SHA-256 salt hashes, with stateful session tokens managed via local storage.

2. **Full Editorial Lifecycle (CRUD)**:
   - **Draft or Edit Essays**: Use the interactive Markdown-supported drafting editor.
   - **Retract (Delete) Posts**: Owners of essays can securely edit or retract posts anytime.

3. **Discussion & Interaction Threading**:
   - Comments section with real-time replies, and visual tags for the original blog author.
   - Dynamic comment count tallies visible inline on main dashboard grid cards.
   - Comments can be retracted (deleted) by original commenters or the essay publisher.

4. **Live Editorial Search**:
   - Instantly filter the publication catalogs by content keywords, titles, or active author pseudonyms.

---

## 🛠️ Technical Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend**: [Express Node Server](https://expressjs.com/) serving REST API paths.
- **Database Layer**: Safe JSON File-System persistence engine (`server_db.json`) that saves state modifications in real time. It is pre-seeded with beautiful dummy editorial content about design and web systems.

---

## 📈 Running the Application

### Development Environment
```bash
# Install package dependencies
npm install

# Run the development Express + Vite server proxy concurrently
npm run dev
```

### Production Build & Launch
This compiles our frontend assets into static bundles and packages our backend TypeScript server into a high-performance, bundled entry script:
```bash
# Build production bundle
npm run build

# Start production Node server proxying the optimized build
npm run start
```
