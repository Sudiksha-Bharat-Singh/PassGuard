# PassGuard - Real-Time Password Strength Analyzer

> **Analyze. Strengthen. Secure.**

PassGuard is a modern cybersecurity web application designed to evaluate password strength in real time. Built with a high-performance Flask backend, an SQLite database for anonymized analysis tracking, and a sleek dark glassmorphism user interface inspired by SaaS security dashboards like Cloudflare, CrowdStrike, and SentinelOne.

---

## 🛡️ Features

- **Real-Time Password Analysis**: Evaluates password input dynamically with 0ms UI latency.
- **100-Point Scoring Engine**: Evaluates length, character variety, entropy, sequential walks, and common dictionary patterns.
- **Estimated Crack Time Calculation**: Computes time required for brute-force attacks based on mathematical entropy.
- **Interactive Security Checklist**: Checks minimum length (8 characters required, 12+ recommended), uppercase, lowercase, numbers, special symbols, dictionary words, and repeated characters.
- **Intelligent Recommendation Engine**: Generates real-time suggestions to strengthen passwords.
- **Secure Password Generator**: Generates high-entropy random passwords (8–20 characters).
- **Privacy-Preserving SHA-256 History**: Logs cryptographic SHA-256 hashes only (never plaintext passwords) and flags re-analyzed passwords.
- **Dark Glassmorphism Interface**: Designed with frosted panels, glowing border highlights, and smooth animations.

---

## 🔒 Password Security Policy
- **Minimum Required Length**: 8 Characters
- **Recommended Best Practice**: 12+ Characters

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Vanilla JavaScript (ES6+), Lucide Icons, Poppins Font.
- **Backend**: Python 3, Flask, Flask-CORS.
- **Database**: SQLite3 (`passwords.db`).

---

## 📂 Folder Structure

```
PassGuard/
├── backend/
│   ├── app.py              # Flask server and REST API routes
│   ├── analyzer.py         # Password strength scoring engine & generator
│   ├── database.py         # SQLite connection & history queries
│   ├── requirements.txt    # Python backend dependencies
│   └── passwords.db        # SQLite database (auto-generated)
├── frontend/
│   ├── index.html          # Application structure & UI markup
│   ├── style.css           # Glassmorphism dark theme design system
│   └── script.js           # Client-side reactivity & API integration
└── README.md               # Project documentation
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.8+ installed on your system.

### Steps

1. **Clone or Navigate to the Project Root**:
   ```bash
   cd PassGuard
   ```

2. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

---

## 🚀 How to Run

1. **Start the Flask Backend Server**:
   ```bash
   python backend/app.py
   ```

2. **Access the Application**:
   Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🖼️ Screenshots Placeholder

*(Insert screenshots of the PassGuard Dashboard, Strength Meter, Security Checklist, and Analysis History Drawer here)*

---

## 🔮 Future Improvements

- Support for HaveIBeenPwned API integration using K-Anonymity SHA-1 hash prefix lookups.
- Export analysis reports in PDF / JSON formats.
- Password policy rule customization (e.g. enterprise compliance rules).

---

## 📄 License

MIT License. Designed for security evaluation and educational purposes.
