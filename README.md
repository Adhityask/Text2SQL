# 🧠 Text2SQL v1.0

Turn **plain English into SQL queries** and get instant answers from your database.  
Built with **Django + React + Google Gemini**, this project is live and ready to explore:

🌐 **Frontend (UI):** [text2sql-llm.netlify.app](https://text2sql-llm.netlify.app/)  
⚙️ **Backend (API):** Hosted on Render (⚠️ may take a minute to wake up if idle)

---

## 🎯 Use Case

Writing SQL queries can be tricky, especially for non-developers. **Text2SQL** solves this by:

- Connecting to your **PostgreSQL or MySQL database**
- Letting you **ask natural language questions** (e.g., *“Show me all students older than 20”*)
- Generating accurate **SQL queries automatically**
- Executing them safely and showing:
  - 📊 **Raw data** (JSON)
  - 🗣️ **Easy-to-understand explanations**

It’s like having a personal **database assistant** that speaks both English and SQL.

---

## ✨ What It Can Do

- 🔑 **Secure API key setup** (Google Gemini AI)
- 🗄️ **Database connection** with credentials or connection string
- 📋 **View available tables**
- 💬 **Ask questions in English**
- 🧠 **LLM-powered SQL generation** (schema-aware, no hallucinations)
- ▶️ **Execute queries** directly from the UI
- 📊 **Get results explained in simple language**
- 🔄 **Reset & refresh connections**

---

## 🛠️ How to Setup Locally

### 1️⃣ Clone the repo
```bash
git clone https://github.com/Adhityask/Text2SQL.git
cd text2sql
````

### 2️⃣ Backend (Django + DRF)

```bash
cd backend
python -m venv venv
# Activate venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs on: **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

### 3️⃣ Frontend (React + Tailwind)

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on: **[http://localhost:5173/](http://localhost:5173/)** (or similar)

---

## 🚀 Live Demo (Recommended)

Instead of setting up locally, try it here:
🔗 [text2sql-llm.netlify.app](https://text2sql-llm.netlify.app/)

⚠️ Note: Since the backend is hosted on **Render (free tier)**, it may take **30–60 seconds** to wake up if idle.

---

## 💡 Example Questions

Once connected to your database, try asking:

* “Show me all tables”
* “Count all records in students table”
* “What’s the average salary of employees?”
* “List top 5 products by sales”
* “Orders placed in the last 7 days”

---

## 📚 Tech Stack

* **Frontend:** React, TailwindCSS, lucide-react
* **Backend:** Django REST Framework, SQLAlchemy, LangChain
* **AI:** Google Gemini (via LangChain)
* **Hosting:** Netlify (frontend), Render (backend)

---
