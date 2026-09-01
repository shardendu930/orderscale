# OrderScale

An e-commerce admin panel built to handle **100,000+ orders** without breaking a
sweat — server-side pagination/filtering/sorting, a virtualized table (only
visible rows ever touch the DOM), infinite scroll, and a natural-language
search box powered by Gemini.

```
orderscale/
├── backend/     Node.js + Express + MongoDB API
└── frontend/    React (Vite) admin dashboard
```

## Why this exists

Loading "all the rows" into a browser tab breaks somewhere between 5,000 and
50,000 rows — the tab freezes or crashes. This project solves that the way
real admin tools do: the database only ever returns a small page at a time,
and the frontend only ever renders the rows currently visible on screen
(virtualization), swapping them out as you scroll.

## Features

- JWT-authenticated single admin login (this is an internal tool, not a public product)
- Server-side pagination, filtering (status, payment method, amount range, date range), sorting, and full-text search
- Virtualized table via `react-window` — smooth scrolling through hundreds of thousands of rows
- Infinite scroll that fetches new pages as you approach the bottom
- Inline status editing directly from the table
- Aggregated stats (total orders, revenue, breakdown by status) computed with a MongoDB aggregation pipeline, not in JavaScript
- Natural-language filter box: type "pending orders over 500 from last month" and it's parsed into real filters via Gemini
- A seed script that generates 100,000+ realistic fake orders to prove all of the above actually holds up at scale

## 1. Run it locally

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works well)
- Optional: a free [Gemini API key](https://aistudio.google.com/app/apikey) for the natural-language search box

### Backend

```bash
cd backend
cp .env.example .env       # fill in MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                # generates 100,000 fake orders — takes a minute or two
npm run dev                 # http://localhost:5001
```

Want a different amount of test data? `npm run seed -- 250000` for 250k rows,
`npm run seed -- 5000` for a quick local test.

### Frontend

```bash
cd frontend
cp .env.example .env        # defaults already point at localhost:5001
npm install
npm run dev                 # http://localhost:5174
```

Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in the backend's `.env`.

## 2. Deploy

Same pattern as a typical MERN deploy — MongoDB Atlas, Render for the API, Vercel for the frontend.

### Database — MongoDB Atlas
Create a free cluster, add a database user, allow network access from anywhere (0.0.0.0/0), copy the connection string.

### Backend — Render
1. New Web Service → root directory `backend` → build `npm install` → start `npm start`
2. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL` (your Vercel URL), and optionally `GEMINI_API_KEY`
3. After deploying, run the seed script once against your production database — either via Render's shell (`npm run seed`) or by temporarily pointing your local `.env`'s `MONGO_URI` at the Atlas cluster and running `npm run seed` locally.

### Frontend — Vercel
1. Import the repo, root directory `frontend`, framework preset Vite
2. Environment variable: `VITE_API_URL` = `https://your-backend.onrender.com/api`
3. Deploy, then go back to Render and set `CLIENT_URL` to this Vercel URL

## 3. API reference

| Method | Route                        | Description                                    |
|--------|-------------------------------|-------------------------------------------------|
| POST   | /api/auth/login               | Admin login, returns a JWT                       |
| GET    | /api/orders                   | Paginated/filtered/sorted orders                 |
| GET    | /api/orders/stats             | Aggregated totals and status breakdown           |
| GET    | /api/orders/:id                | Single order                                     |
| PATCH  | /api/orders/:id/status         | Update an order's status                         |
| POST   | /api/orders/nl-query           | Parse a plain-English query into filter params   |

`GET /api/orders` accepts: `page`, `limit` (max 200), `sortBy`, `sortDir`, `status`,
`paymentMethod`, `minAmount`, `maxAmount`, `startDate`, `endDate`, `search`.

## Resume bullet mapping

- **Handled 100,000+ orders with server-side pagination and virtualized rendering** → `backend/routes/orders.js` (pagination), `frontend/src/components/OrdersTable.jsx` (react-window virtualization)
- **Sub-second filtering/sorting at scale via indexed MongoDB queries** → `backend/models/Order.js` (compound + text indexes)
- **Natural-language search parsed into structured queries via Gemini** → `backend/routes/nlQuery.js`
- **Aggregated analytics computed in-database, not in application code** → `backend/routes/orders.js` (`/stats` aggregation pipeline)
- **JWT-authenticated admin console** → `backend/middleware/auth.js`, `frontend/src/components/ProtectedRoute.jsx`
