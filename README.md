# 💰 Expensio AI – Smart Personal Finance & Group Expense Manager

> A full-stack AI-powered finance management platform with group expense splitting, receipt scanning, and personalized financial insights.

🔗 **Live Demo:** [expensio-ashy.vercel.app](https://expensio-ashy.vercel.app)  
🖥️ **Backend API:** [expensio-yiyg.onrender.com](https://expensio-yiyg.onrender.com)

---

## 📸 Screenshots



| Dashboard |
|-----------|
| <img width="953" height="437" alt="Screenshot 2026-06-28 171836" src="https://github.com/user-attachments/assets/ba7c6d37-f404-4f8c-a95b-950aac4496be" /><img width="953" height="443" alt="Screenshot 2026-06-28 171859" src="https://github.com/user-attachments/assets/2f00e9a1-592d-407f-bff5-328dce51d6b1" />

| Expenses |
|-----------|
| <img width="952" height="437" alt="Screenshot 2026-06-28 172227" src="https://github.com/user-attachments/assets/749a5ae3-2037-455e-b9eb-f6328ff0c08f" />

| AI Assistant |
|-----------|
| <img width="955" height="434" alt="Screenshot 2026-06-28 172249" src="https://github.com/user-attachments/assets/460b3712-f666-46d2-8eeb-50e1bf95660e" /><img width="955" height="440" alt="Screenshot 2026-06-28 172315" src="https://github.com/user-attachments/assets/cd283a8b-1ac8-4255-bfa5-c71b6d306097" />

| Groups |
|--------|
| <img width="956" height="398" alt="Screenshot 2026-06-28 173112" src="https://github.com/user-attachments/assets/c6036482-2b4b-41f7-89f5-dc38646a3331" /><img width="949" height="440" alt="Screenshot 2026-06-28 173134" src="https://github.com/user-attachments/assets/b3af781c-a88a-4008-878a-eee43d7f7a0d" />

| Budget |
|--------|
|<img width="955" height="436" alt="Screenshot 2026-06-28 173456" src="https://github.com/user-attachments/assets/9b797e1a-feec-4ed9-8e2c-75c14307b5e9" />

| Reports |
|---------|
|<img width="958" height="439" alt="Screenshot 2026-06-28 173520" src="https://github.com/user-attachments/assets/5d8a4015-8700-4790-80ce-767d1832e797" /><img width="952" height="434" alt="Screenshot 2026-06-28 173535" src="https://github.com/user-attachments/assets/245959d2-f769-404b-8232-71540cd6898e" />



---

## ✨ Features

### 🔐 Authentication
- Secure Signup & Login with JWT
- Password hashing with bcrypt
- Protected routes & persistent sessions
- Multi-currency support (USD, EUR, INR, GBP, JPY, and more)

### 📊 Personal Finance Tracking
- Add, edit, delete expenses with categories
- Income tracking with source categories
- Search & filter expenses by category, date, keyword
- Pagination for large datasets

### 🎯 Budget Management
- Set monthly budgets per category
- Real-time progress bars with color alerts
- Over-budget warnings with visual indicators
- Multi-month budget tracking

### 👥 Group Expense Splitting (Splitwise-like)
- Create groups for trips, roommates, events
- Add members by email
- Three split types: **Equal**, **Custom**, and **Percentage**
- Debt simplification algorithm (minimizes number of transactions)
- Settlement tracking & history

### 🤖 AI Financial Assistant
- Powered by **Groq (LLaMA 3.3 70B)**
- Answers personalized questions based on your actual data
- Responds in your chosen currency
- Chat history saved across sessions
- Quick prompt suggestions

### 🧾 Receipt Scanner
- Upload receipt images (PNG, JPG, WEBP)
- OCR text extraction via **Tesseract.js**
- AI parses merchant name, amount, date, category
- Auto-fills expense form

### 📈 Dashboard & Reports
- Summary cards: Income, Expenses, Savings, Savings Rate
- Doughnut chart — expense category breakdown
- Line chart — 12-month spending trend
- Bar chart — monthly category comparison
- Monthly report with full transaction history

### 🎨 UI/UX
- Dark mode professional SaaS design
- Fully responsive (Desktop, Tablet, Mobile)
- Framer Motion animations throughout
- Skeleton loaders, toast notifications, empty states
- Collapsible mobile sidebar

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations & transitions |
| Chart.js + react-chartjs-2 | Data visualizations |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| React Hot Toast | Notifications |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| Prisma ORM | Database access layer |
| PostgreSQL | Relational database |
| JWT + bcrypt | Authentication & security |
| Groq SDK (LLaMA 3.3 70B) | AI financial assistant |
| Tesseract.js | OCR receipt scanning |
| Multer | File upload handling |
| Helmet + CORS | Security middleware |
| express-rate-limit | API rate limiting |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Neon | PostgreSQL database |
| GitHub | Version control & CI/CD |

---

## 🗄 Database Schema

9 Prisma models:

```
User → Expense, Income, Budget, GroupMember, GroupExpense, ChatMessage
Group → GroupMember, GroupExpense, Settlement
GroupExpense → GroupExpenseSplit
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Groq API key 

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npx prisma db push
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
expensio-ai/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (9 models)
│   └── src/
│       ├── server.js              # Express app entry point
│       ├── config/prisma.js
│       ├── controllers/           # 7 controllers
│       ├── routes/                # 7 route files
│       └── middleware/            # Auth, error, validation
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/                 # 10 pages
        ├── components/common/     # Modal, StatCard, Skeleton, etc.
        ├── layouts/AppLayout.jsx
        ├── context/AuthContext.jsx
        ├── services/api.js
        └── utils/formatters.js
```

---

## 🌐 API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/incomes
POST   /api/incomes
PUT    /api/incomes/:id
DELETE /api/incomes/:id

GET    /api/budgets
POST   /api/budgets
DELETE /api/budgets/:id

GET    /api/dashboard
GET    /api/dashboard/report/:year/:month

GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
POST   /api/groups/:id/members
POST   /api/groups/:id/expenses
GET    /api/groups/:id/balances
POST   /api/groups/:id/settle

POST   /api/ai/chat
GET    /api/ai/chat/history
DELETE /api/ai/chat/history
GET    /api/ai/group/:groupId/insights
POST   /api/ai/scan-receipt
```

---

## 🚢 Deployment

### Backend → Render
- Root Directory: `backend`
- Build Command: `npm install && npx prisma generate`
- Start Command: `node src/server.js`

### Frontend → Vercel
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 👨‍💻 Author

*MAHIMA GUPTA*

Built as a full-stack project demonstrating modern web development with AI integration.

---
