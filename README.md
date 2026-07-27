# 11Players (Hagoozat Elite)

![11Players Cover](/public/logo.jpg)

**11Players (Hagoozat Elite)** is the premier platform for managing football (soccer) communities. It allows groups to create their own communities, manage detailed player FUT cards, track stats, and automatically organize highly-balanced matches using a custom matchmaking algorithm based on 13 PES position weight matrices, physical attributes, and real-time Firestore sync.

---

## 🌟 Key Features

- **Futbol Roster & FUT Profile Cards**: Dynamic FIFA/EA Sports FC inspired FUT cards with Gold Elite (85+), Silver Star (75+), Bronze Pro (65+), and Rookie (<65) tier glow borders.
- **Fair Matchmaking Engine**: Advanced 13-position suitability index (PSI) algorithm to divide players into perfectly balanced teams (`variance < 5%`).
- **Peer Reviews & Rating Aggregator**: Player attributes are rated by peers after every match to ensure realistic stats and eliminate inflation.
- **Stat Tracking & Ballon d'Or**: Live tracking of goals, assists, matches played, MOTM awards, and Ballon d'Or podium leaderboards.
- **Season Ceremonies & Trophies**: End-of-season ceremony wizard to award permanent profile trophies (Ballon d'Or, Golden Boot, Top Playmaker, Golden Shield).
- **11AI Tactical Assistant**: Integrated AI chatbot widget (`/api/ai/chat`) powered by Gemini AI for tactical advice, lineup analysis, and announcement enhancement.
- **Progressive Web App & Localization**: Full PWA home screen installation support with seamless Arabic (RTL) and English (LTR) localization.

---

## 🚀 Tech Stack & Engineering Standards

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion Micro-Interactions
- **Backend & Database**: Firebase Auth, Firestore Realtime Streams, Server Actions, Edge Config
- **Testing & Quality Assurance**: Vitest unit testing suite (`npm run test`), Next.js production build checks (`npm run build`)
- **Deployment**: Firebase Hosting & Vercel Edge Runtime

---

## 📄 License

This project is proprietary and closed-source. All rights reserved by **11Players**. See the [LICENSE](LICENSE) file for details.

