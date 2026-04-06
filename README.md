# 🛡️ Vestiga — AI-Powered Zero-Knowledge Security Infrastructure.

> **Vestiga** is a premium, open-source, end-to-end encrypted password manager designed for the modern security-conscious professional. Built with a high-conversion SaaS aesthetic, it combines military-grade encryption with AI-powered security intelligence.

![Vestiga Banner](https://img.shields.io/badge/Security-AES--256--GCM-teal?style=for-the-badge&logo=shield)
![AI Intelligence](https://img.shields.io/badge/AI-Groq%20Llama--3.3-blue?style=for-the-badge&logo=google-gemini)
![Architecture](https://img.shields.io/badge/Architecture-Zero--Knowledge-emerald?style=for-the-badge&logo=vitest)

---

## 💎 The Vestiga Difference

Vestiga isn't just a vault; it's a proactive security perimeter. We've evolved from traditional password management into a high-trust SaaS platform.

*   **🌑 Premium Dark Aesthetics**: A glassmorphism-inspired UI designed for depth, clarity, and focus.
*   **🧠 Neural Security Layer**: Real-time AI audits powered by Groq to identify password leakage and reuse patterns.
*   **📱 Universal Synchronization**: Native web application paired with a robust browser extension for seamless autofill.
*   **🔒 Mathematical Certainty**: Every byte is encrypted client-side using **AES-256-GCM**. We never see your data—only you can.

---

## 🚀 Key Features

### 🛡️ Zero-Knowledge Vault
Initialize your vault with a master password that never leaves your device. PBKDF2 key derivation ensures your primary secret stays local.

### 🧠 AI Security Audits
Get instant, intelligent reasoning on your security posture. Our AI identifies:
*   Weak or predictable entropy scores.
*   High-risk password reuse across critical accounts.
*   Proactive suggestions for hardening your digital identity.

### 🧩 Intelligent Browser Extension
Sync your vault directly with your browser. Features advanced neural form detection and one-click secure autofill without compromising your master key.

### 💼 SaaS Infrastructure
Built for the public web with legal compliance foundations, comprehensive SEO, and dedicated support channels.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Core** | React 19 + TypeScript + Vite 7 |
| **Styling** | Tailwind CSS 4.0 + Framer Motion |
| **Backend** | Node.js + Express 5 + PostgreSQL |
| **Auth** | Supabase (E2EE) + Google OAuth |
| **AI** | Groq API (Llama-3.3-70B) |

---

## ⚙️ Development & Deployment

### 1. Local Setup
```bash
# Clone the repository
git clone https://github.com/Priyankkhatri/My-Vault.git

# Install dependencies
npm install

# Configure local env
cp .env.example .env

# Start the dev server
npm run dev
```

### 2. Production Deployment
Vestiga is designed for a multi-cloud deployment:
*   **Frontend**: Hosted on **Vercel** with SPA routing support.
*   **Backend**: Hosted on **Render** (pointing to the `/server` directory).
*   **Database**: Managed via **Supabase**.

> [!IMPORTANT]
> For detailed deployment steps (CORS, Env Vars, Google OAuth), please see the **[Implementation Plan](file:///C:/Users/priya/.gemini/antigravity/brain/ec8dc18d-897d-435d-a420-3122924e7e05/implementation_plan.md)** or follow our guide in the repository's docs.

---

## 🔒 Security Assurance
Vestiga maintains a **Zero-Touch Integrity** policy. All UI/UX polish is performed in strict isolation from the underlying cryptographic layers. We prioritize mathematical privacy over everything else.

---

## ⚖️ Legal & Support
Vestiga is built for compliance:
*   **Privacy Policy**
*   **Terms of Service**
*   **Support**: pktimepass01@gmail.com

---

Managed by **Priyank Khatri** | [GitHub](https://github.com/Priyankkhatri)
