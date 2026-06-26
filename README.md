# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# Sugarcane ERP System

## Overview

The Sugarcane ERP System is a web-based application that digitizes sugarcane farming operations. It enables sugar companies to manage farmer records, deliveries, payments, and generate operational summaries through a centralized platform.

---

## Problem

Many sugar factories still rely on manual record keeping, resulting in:

- Duplicate farmer records
- Payment errors
- Slow data retrieval
- Poor reporting
- Inefficient management

---

## Solution

This ERP system provides:

- Farmer registration
- Delivery recording
- Payment management
- Dashboard statistics
- REST API for integration
- Fast and secure database storage

---

## System Architecture

```
Frontend (HTML/CSS/JavaScript)
           │
           ▼
      FastAPI Backend
           │
           ▼
     SQLAlchemy ORM
           │
           ▼
      SQLite Database
```

---

## Project Structure

```
SUGARCANE_APP/
│
├── Backend/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   └── requirements.txt
│
├── Frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
└── README.md
```

---

## Setup

### 1. Clone

```bash
git clone <repository-url>
cd SUGARCANE_APP
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate

Windows

```bash
venv\Scripts\activate
```

### 4. Install Packages

```bash
pip install -r requirements.txt
```

### 5. Run Backend

```bash
cd Backend
pyhton -m uvicorn main:app --reload
```

API:

```
http://127.0.0.1:8000
```

Documentation:

```
http://127.0.0.1:8000/docs
```

### 6. Run Frontend

Open the **Frontend** folder and launch:

```
index.html
```

or use

```bash
python -m http.server 5500
```

---

## Technologies

- FastAPI
- SQLAlchemy
- SQLite
- HTML
- CSS
- JavaScript
- Python

---

## Features

- Farmer Registration
- Delivery Tracking
- Payment Recording
- Dashboard Analytics
- Duplicate Farmer Prevention
- RESTful API

---

## Future Improvements

- Login Authentication
- Role-Based Access
- PDF Reports
- SMS Notifications
- Mobile App
- Cloud Deployment

---

## Author

**Obadia Koech**

Bachelor of Information Technology
