
# 🚀 AI-Powered Company Research Assistant

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-FF6B6B?style=for-the-badge)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> **Built for the Relu Consultancy AI & Automation Developer Hackathon.**

## 📖 Overview

The **AI-Powered Company Research Assistant** is a Next.js application designed to completely automate B2B company research. By simply providing a company name or URL, the assistant kicks off a powerful workflow: it crawls the official website, retrieves search engine insights, and uses advanced AI models to synthesize a comprehensive business dossier. The final report includes an executive summary, product/service lists, inferred pain points, and a detailed competitor analysis.

This project implements a **Dual-Provider Architecture**, seamlessly bridging **OpenRouter** (for dynamic model selection) and **NVIDIA NIM** (for high-performance enterprise AI), giving you the ultimate flexibility in how insights are generated.

---

## ✨ Features & Bonus Implementations

This project doesn't just meet the baseline requirements—it goes above and beyond, fulfilling all bonus objectives from the hackathon rubric:

*   **Dual-Provider Architecture:** Natively supports both OpenRouter (default) and NVIDIA NIM for LLM processing, allowing seamless switching and fallback mechanisms.
*   **🤖 Discord Integration (Bonus!):** A dedicated settings page lets you input a Bot Token and Channel ID. Upon report generation, the app automatically pushes a rich text alert and the generated PDF directly to your Discord channel via the Discord API using `multipart/form-data`.
*   **📄 Professional PDF Generation (Bonus!):** One-click, beautifully formatted PDF reports rendered client-side using `jsPDF` and `jsPDF-autotable`. The PDFs include all AI insights and competitor data in a clean, professional layout.
*   **💅 UI/UX Polish (Bonus!):** A modern, dark-mode, highly responsive "ChatGPT-style" interface. It features real-time progress logging (via Server-Sent Events), a split-pane dossier layout, and smooth loading states for a premium user experience.
*   **🕷️ Intelligent Web Crawling (Bonus!):** Custom crawler routing strategically targets high-value paths (like `/about`, `/products`) while stripping out noise (like `<nav>`, `<footer>`). This dramatically optimizes context windows and reduces token costs.

---

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
*   **Web Crawling:** Cheerio (for fast, headless, targeted DOM parsing)
*   **Search & Routing:** Serper.dev API
*   **AI/LLM Processing:** OpenRouter API (dynamic model selection) & NVIDIA NIM
*   **PDF Generation:** jsPDF & jsPDF-autotable (Client-side rendering)
*   **Deployment:** Vercel

---

## 🏗️ Architecture & Workflow

1.  **Input Resolution:** The user provides a company name or URL. If a name is given, the Serper API resolves it to the official website.
2.  **Parallel Data Gathering:**
    *   **Search:** Serper API gathers general knowledge graph data and contact snippets.
    *   **Crawl:** The intelligent crawler targets high-value pages, parses the DOM with Cheerio, and extracts relevant text.
3.  **AI Analysis (OpenRouter / NVIDIA NIM):** The gathered data is fed into the selected AI provider. The model generates a structured profile including summaries, products, and pain points.
4.  **Competitor Identification:** The AI cross-references search data to identify and analyze top competitors.
5.  **Presentation & Export:** The UI updates in real-time. Once complete, the user can view the split-pane dossier, generate a PDF, and automatically push the report to Discord.

---

## 🚀 Setup Instructions

Follow these steps to get the project running locally:

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Configuration

Create a `.env.local` file in the root of the project and add the necessary API keys.

```bash
cp .env.example .env.local
```

Open `.env.local` and configure the following variables:

```env
# Required: Your OpenRouter API Key for the default AI provider
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Required: Your Serper.dev API Key for web search
SERPER_API_KEY=your_serper_api_key_here

# Optional: Your NVIDIA API Key for the NVIDIA NIM provider
NVIDIA_API_KEY=your_nvidia_api_key_here

# Optional: Ensure your app URL is set for OpenRouter headers
APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## ⚙️ Environment Variables Documentation

*   `OPENROUTER_API_KEY`: Required to authenticate with the OpenRouter API for primary LLM completions.
*   `SERPER_API_KEY`: Required to use the Serper API for resolving company names to URLs and gathering search/competitor data.
*   `NVIDIA_API_KEY`: Required if you choose to utilize the NVIDIA NIM provider for AI analysis. The system will gracefully fall back to OpenRouter or throw an error if this is missing while the NVIDIA provider is selected.
*   `APP_URL`: Used to set the `HTTP-Referer` header for OpenRouter requests, ensuring proper analytics and tracking on the provider side. Defaults to `http://localhost:3000` locally.
