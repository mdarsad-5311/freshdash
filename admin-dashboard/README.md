# FreshDash Admin Web Dashboard

A modern, standalone operations management web dashboard for the **FreshDash** quick-commerce platform, built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. Connects directly to the Django REST Framework backend `/api/v1/admin/` endpoints.

---

## Features

- **Admin Authentication:** Role-verified login (`admin`, `manager`, `staff`), token persistence in `localStorage`, automatic JWT refresh rotation, and session timeout management.
- **Analytics Dashboard:** Real-time revenue, order fulfillment breakdown, bestselling produce charts, and low-stock indicators computed dynamically from backend SQLite database.
- **Produce Product Management:** Full CRUD, image uploads, price and discount calculation, category assignment, stock levels, and instant availability toggles.
- **Category Management:** Taxonomy tree, color tinting, active state toggle, and product deletion constraint guards.
- **Order Management:** Real-time order monitoring, status workflow updates (`placed` -> `confirmed` -> `processing` -> `shipped` -> `out_for_delivery` -> `delivered` / `cancelled`), payment status tracking, and automated stock replenishment upon cancellation.
- **Customer Directory:** Customer overview, lifetime spend aggregation, address book inspection, order history, and account active/blocked toggling.
- **Inventory & Batch Operations:** Single and batch stock adjustments with atomic database transaction safety.

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **Navigation:** React Router DOM v6
- **HTTP Client:** Axios with request & response interceptors
- **Data Visualization:** Recharts
- **Icons:** Lucide React

---

## Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the backend API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

*(For production, update to your live HTTPS backend URL, e.g., `https://api.freshdash.com/api/v1`)*

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The admin web dashboard will start locally on `http://localhost:3000`.

### 4. Build for Production

```bash
npm run build
```

Production static assets will be output to `dist/`.

### 5. Preview Production Build

```bash
npm run preview
```

---

## Backend Requirements

Ensure the Django backend is running with administrative accounts:

```bash
cd freshdash-backend
python manage.py runserver 0.0.0.0:8000
```

Log in using an account with `is_staff=True` or `role='admin'` / `role='manager'`. Normal consumer customer accounts are denied access with `403 Forbidden`.

