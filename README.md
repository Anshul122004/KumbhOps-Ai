# KumbhOps AI

Hackathon MVP for volunteer recruitment, approval, assignment, monitoring, emergency response, and AI-assisted operations during Simhastha Kumbh.

This repository currently contains **Module 1: Project Setup** only.

## Installation Commands

Create the projects manually from this scaffold:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Equivalent commands if creating from scratch:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install @supabase/supabase-js react-router-dom lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer vite
npx tailwindcss init -p
npx shadcn@latest init

cd ..
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D nodemon
```

## Environment Setup

Copy the examples:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Fill in your Supabase project URL and keys.

## Run

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

## Generated File Placement

```txt
frontend/
  package.json                  Frontend dependencies and scripts
  index.html                    Vite HTML entry
  vite.config.js                Vite configuration
  tailwind.config.js            Tailwind configuration
  postcss.config.js             PostCSS configuration
  components.json               Shadcn UI configuration
  .env.example                  Frontend Supabase env template
  src/main.jsx                  React entry point
  src/App.jsx                   App wrapper
  src/router.jsx                React Router routes
  src/styles/globals.css        Tailwind and base styles
  src/lib/supabase.js           Supabase browser client
  src/lib/utils.js              Shared className utility for Shadcn-style components
  src/lib/constants.js          MVP zones and navigation constants
  src/hooks/useAuth.js          Supabase Auth session/profile hook
  src/components/layout/*       Public, volunteer, and manager layouts
  src/components/auth/*         Protected route guards
  src/pages/*                   Module 1 placeholder pages

backend/
  package.json                  Backend dependencies and scripts
  .env.example                  Backend env template
  src/server.js                 Express server bootstrap
  src/app.js                    Express app setup
  src/config/env.js             Environment config
  src/config/supabase.js        Supabase admin/client setup
  src/routes/health.routes.js   Health check route
  src/routes/index.js           API route registry
  src/middleware/error.js       Error handler
```

## Module 1 Scope

Included:

- React + Vite frontend
- Tailwind CSS setup
- Shadcn-compatible config
- React Router routes
- Supabase browser client
- Express backend
- Supabase backend client
- Environment variable templates
- Public, volunteer, and manager layouts
- Protected route structure

Not included yet:

- Volunteer registration logic
- Manager approvals
- Assignment logic
- Gemini AI integration
- Database schema
- Scenario simulator
