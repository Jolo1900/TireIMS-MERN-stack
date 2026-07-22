# TireIMS - Tire Inventory Management System

TireIMS is a modern, responsive, and secure full-stack web application designed for tire shops to manage product inventory, track supplier details, log transactions, and execute retail POS (Point of Sale) checkouts with automatic stock updates, receipt options, and transaction deletion reversions.

---

## ✨ Features

1.  **Glassmorphism Dashboard**: Real-time business KPIs (Total stock count, valuation cost, potential retail profit), low-stock warning banners, recent activity audits, and brand distribution progress bars.
2.  **Product Catalog**: Advanced sorting, brand filtering, search queries, pagination, and forms to add, edit, or delete tires.
3.  **Stock Manager**: Record manual additions (Restocks) and subtractions (Adjustments/Sales) for single products.
4.  **Sales POS Terminal**: Add tires to a shopping cart, compute subtotals, calculate client cash change, toggle print receipts on or off, and print monospace invoice receipts.
5.  **Audit Logs & Reversions**: Displays chronological ledger logs. Admins can delete transaction logs to revert stock levels automatically.
6.  **Executive Reports**: View daily, monthly, custom range profit summaries, or inventory valuations with styled print-media templates.
7.  **JWT Authentication Security**: Fully protected REST routes using JSON Web Token (JWT) bearer validation and role-based route gates (Admin vs. Cashier).
8.  **Adaptive Responsive UI**: Uses a bottom navigation bar layout on mobile/tablet views and a side navigation drawer on desktops.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, MongoDB Atlas, Mongoose ODM, jsonwebtoken.
*   **Frontend**: React, Axios, Vite, Vanilla CSS.

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) installed (v20+ recommended).
*   A running [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster or local database instance.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd tireims
    ```

2.  **Configure Backend Environment**:
    Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/tireims
    JWT_SECRET=your_super_secret_key_here
    ```

3.  **Start the Backend Server**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
    *The server runs at `http://localhost:5000` and seeds default credentials on initial database connect.*

4.  **Start the Frontend App**:
    In a new terminal window:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *The app opens automatically at `http://localhost:5173` (or `5174`).*

---

## 🔑 Default Credentials

The system automatically generates these two user profiles on startup:

*   **Admin Profile** (Full management, delete transactions, view reports):
    *   **Username**: `admin`
    *   **Password**: `admin123`
*   **Cashier Profile** (Sales POS checkout, read-only catalog, logs):
    *   **Username**: `cashier`
    *   **Password**: `cashier123`
