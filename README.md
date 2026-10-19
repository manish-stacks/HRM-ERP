# Apex Enterprise HRM & Workforce Management Platform

A comprehensive, production-grade enterprise Human Resource Management System (HRMS) built with React, TypeScript, Vite, Tailwind CSS, Express, and Prisma ORM with MySQL.

---

## 🏗️ Technology Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios.
- **Backend**: Node.js, Express, TypeScript, REST API under `/api/v1`, Prisma ORM, MySQL 8+, Zod, Winston.
- **Biometric Face Attendance**: Web camera live stream, canvas landmark tracking, client-side liveness / anti-spoof motion verification, 128-d spatial descriptor extraction, AES-256-GCM template encryption, and server-side Cosine Similarity vector matching.
- **Payroll Engine**: Strict `decimal.js` monetary math, locked historical runs, statutory deductions, and printable payslips.
- **Security & RBAC**: Granular role-based permissions, multi-tenant organization data scoping, audit trails, and JWT session handling.

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- Node.js v18+ or v20+
- npm v9+
- MySQL 8.0+ or Docker Desktop

### 2. Environment Configuration
Copy environment files:
```bash
# In backend/
cp .env.example .env
```
Default local development uses SQLite or MySQL.
To use MySQL:
```env
DATABASE_URL="mysql://hrm_user:hrm_password@localhost:3306/hrm_erp_db"
```

### 3. Database Migration & Seeding
```bash
# Push database schema
npm run prisma:generate
cd backend && npm run seed
```

### 4. Running Locally
Run backend (port 5000):
```bash
cd backend
npm run dev
```

Run frontend (port 5173):
```bash
cd frontend
npm run dev
```

Visit web application at: **`http://localhost:5173`**

---

## 🔑 Default Enterprise Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@apexglobal.io` | `Admin@123` | Full enterprise administrative & system access |
| **Dept Manager** | `manager@apexglobal.io` | `Admin@123` | Team oversight, shift approvals, appraisals |
| **Senior Engineer** | `john.doe@apexglobal.io` | `Admin@123` | Self-service, face attendance, leaves, payslips |

---

## 📚 API & Swagger OpenAPI Documentation

Interactive Swagger documentation is available at:
```
http://localhost:5000/api/docs
```
REST API health check:
```
http://localhost:5000/health
```

---

## 🧪 Automated Testing

Run the automated integration test suite:
```bash
cd backend
npm test
```
The test suite validates:
- Strict decimal arithmetic & financial precision
- Biometric 128-d vector cosine similarity & euclidean distance
- AES-256-GCM biometric template encryption & decryption
- Multi-tenant database isolation
- Shift scheduling & overnight attendance calculations
- Payroll locking & payslip snapshot immutability
- Audit log compliance tracking

---

## 🐳 Docker Deployment

To launch the full enterprise stack with MySQL 8.0, Redis, Express Backend, and Frontend:
```bash
docker compose up -d
```

---

## 📱 Future Mobile Application

See [`MOBILE_API_SPEC.md`](./MOBILE_API_SPEC.md) for details on React Native (Expo + TypeScript) integration, offline attendance queue reconciliation, GPS coordinates, and push notification tokens.

