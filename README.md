# Clarity

Clarity is a personal expense tracking app with authentication, transaction CRUD, filtering, and a spending overview dashboard.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB (Mongoose)
- Auth: JWT (Bearer token)

## Features

- Sign up and login
- Add income/expense transactions
- Edit and delete transactions
- List all transactions
- Filter by category, type, and date range
- Dashboard summary with:
  - Total income
  - Total expense
  - Balance
  - Expense-by-category breakdown
- Responsive layout for desktop and mobile
- Filter state is preserved in session (`sessionStorage`)

## Project Structure

- `Backend/` Express API
- `Frontend/` React app

## Backend Setup

1. Go to backend:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create env file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` values as needed:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL`
5. Run dev server:
   ```bash
   npm run dev
   ```

Backend default URL: `http://localhost:8001`

## Frontend Setup

1. Go to frontend:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create env file:
   ```bash
   cp .env.example .env
   ```
4. Start frontend:
   ```bash
   npm run dev
   ```

Frontend default URL: `http://localhost:5173`

## API Endpoints

Base URL: `http://localhost:8001/api`

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me` (protected)

### Transactions (protected)

- `GET /transactions`
  - Query params: `category`, `type`, `startDate`, `endDate`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions/dashboard`
  - Query params: `startDate`, `endDate`

## Notes

- Send JWT as `Authorization: Bearer <token>`.
- Categories are currently fixed in both backend and frontend constants.
- Date format expected: ISO string (`YYYY-MM-DD` is accepted by the app form).
