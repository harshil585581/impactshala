# Impact

A full-stack social networking platform built with React, TypeScript, FastAPI, and Supabase.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router v7
- Supabase JS client

**Backend**
- Python / FastAPI
- Supabase (PostgreSQL)
- Uvicorn

---

## Features

- Authentication (login / signup)
- User profiles with experience, education, and skills
- Posts, comments, and saved content
- Follow system and community groups
- Direct messaging and WebRTC video/audio calls
- Notifications
- Learning and employment sections
- Endorsements and achievements
- Search across users and content
- Admin panel with client request management

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- A Supabase project (URL + anon key)

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file in `backend/`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database

Apply the migration in Supabase SQL editor:

```bash
backend/supabase_migration.sql
```

---

## Project Structure

```
impact/
├── src/
│   ├── components/       # Shared UI components
│   ├── pages/            # Route-level page components
│   ├── services/         # API + Supabase service layer
│   ├── hooks/            # Custom React hooks
│   ├── features/         # Feature-specific logic
│   ├── types/            # TypeScript types
│   └── utils/            # Utility helpers
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── requirements.txt
│   └── supabase_migration.sql
└── supabase/             # Supabase config
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
