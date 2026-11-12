# 🏠 Murithi Rental Management System
### Full-Stack · React + FastAPI + PostgreSQL

---

## 📁 Project Structure

```
rental-management/
├── backend/
│   ├── main.py                  ← FastAPI app entry
│   ├── database.py              ← DB connection
│   ├── models.py                ← SQLAlchemy models
│   ├── schemas.py               ← Pydantic schemas
│   ├── seed.py                  ← Seed DB with houses & admin
│   ├── requirements.txt
│   ├── .env                     ← Your environment variables
│   ├── routers/
│   │   ├── auth.py              ← Login / register
│   │   ├── houses.py            ← House CRUD
│   │   ├── tenants.py           ← Tenant CRUD
│   │   └── payments.py          ← Payments + dashboard
│   ├── services/
│   │   └── email_service.py     ← Gmail SMTP email
│   └── utils/
│       └── auth.py              ← JWT helpers
└── frontend/
    ├── src/
    │   ├── App.jsx              ← Router setup
    │   ├── main.jsx             ← React entry
    │   ├── index.css            ← Global styles + Tailwind
    │   ├── api/index.js         ← All API calls
    │   ├── context/
    │   │   └── AuthContext.jsx  ← Login state
    │   ├── components/
    │   │   ├── Layout.jsx       ← App shell + sidebar
    │   │   ├── Modal.jsx        ← Reusable modal
    │   │   └── FormField.jsx    ← Input/Select/Textarea
    │   └── pages/
    │       ├── LoginPage.jsx    ← Login screen
    │       ├── DashboardPage.jsx← Stats + charts
    │       ├── HousesPage.jsx   ← House management
    │       ├── TenantsPage.jsx  ← Tenant management
    │       └── PaymentsPage.jsx ← Payment recording
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## ⚙️ STEP 1 — Check & Install Prerequisites

### Check Node.js (need v18+)
```bash
node --version
npm --version
```
**If not installed:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows → https://nodejs.org (download LTS installer)
```

### Check Python (need 3.10+)
```bash
python3 --version
pip3 --version
```
**If not installed:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv -y

# macOS
brew install python3

# Windows → https://python.org (check "Add to PATH" during install)
```

### Check PostgreSQL
```bash
psql --version
```
**If not installed:**
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew install postgresql@15
brew services start postgresql@15

# Windows → https://www.postgresql.org/download/windows/
```

---

## 🗄️ STEP 2 — Set Up Database

```bash
# Open PostgreSQL prompt
sudo -u postgres psql          # Linux
psql postgres                  # macOS / Windows

# Run these SQL commands inside psql:
CREATE USER rental_admin WITH PASSWORD 'StrongPass123!';
CREATE DATABASE rental_db OWNER rental_admin;
GRANT ALL PRIVILEGES ON DATABASE rental_db TO rental_admin;
\q

# Test your connection (should ask for password)
psql -U rental_admin -d rental_db -h localhost
```

---

## 🐍 STEP 3 — Backend Setup

```bash
# Navigate to backend folder
cd rental-management/backend

# Create Python virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate           # Linux / macOS
# OR
venv\Scripts\activate              # Windows

# Install all Python packages
pip install -r requirements.txt

# Verify key packages installed
pip show fastapi sqlalchemy psycopg2-binary
```

### Create your `.env` file:
```bash
cp .env.example .env
nano .env        # or use any text editor
```

Fill in your values:
```env
DATABASE_URL=postgresql://rental_admin:StrongPass123!@localhost:5432/rental_db
SECRET_KEY=generate-a-long-random-string-here-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM_NAME=Murithi Rentals
```

> **Gmail App Password Setup:**
> 1. Go to Google Account → Security
> 2. Enable 2-Factor Authentication
> 3. Go to App Passwords → Create new → Copy the 16-character password
> 4. Paste it as `SMTP_PASSWORD`

### Seed the database with houses + admin:
```bash
python seed.py
# Creates: 11 houses (B1-B6, S1-S5) + admin user
# Default login: username=admin, password=admin123
```

### Start the backend server:
```bash
uvicorn main:app --reload --port 8000

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Verify backend is running:
```bash
# In a new terminal
curl http://localhost:8000/
# Should return: {"message":"Murithi Rental Management API","status":"running"}

# View interactive API docs:
# Open browser → http://localhost:8000/docs
```

---

## ⚛️ STEP 4 — Frontend Setup

```bash
# Navigate to frontend folder
cd rental-management/frontend

# Install Node packages
npm install

# Verify key packages
npm list react react-router-dom recharts

# Start development server
npm run dev
# Opens at: http://localhost:5173
```

---

## 🔐 STEP 5 — First Login

1. Open browser → `http://localhost:5173`
2. You'll see the login page
3. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`
4. ⚠️ **Change this password immediately** after logging in

To change password via API:
```bash
# Open http://localhost:8000/docs
# Use POST /api/auth/register to create a new admin
# (only works when no admin exists — use SQL if needed)
```

---

## 🚀 Running Both Servers (Development)

**Terminal 1 — Backend:**
```bash
cd rental-management/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd rental-management/frontend
npm run dev
```

**Then open:** `http://localhost:5173`

---

## 📧 Email Features

The system sends emails automatically:
- **Welcome email** — when you add a new tenant (if email provided)
- **Payment receipt** — when you record a payment (checkbox in form)
- **Payment reminder** — click "Send Reminders" button in Payments page

All emails are sent via Gmail SMTP in the background (non-blocking).

---

## 🏗️ Production Deployment

### Backend (Gunicorn)
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Build for Production)
```bash
npm run build
# Creates /dist folder — deploy to Netlify, Vercel, or Nginx
```

### Nginx config (optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🛠️ Useful Commands Reference

| Task | Command |
|------|---------|
| Start backend | `uvicorn main:app --reload` |
| Start frontend | `npm run dev` |
| Seed database | `python seed.py` |
| View API docs | `http://localhost:8000/docs` |
| Check DB status | `sudo systemctl status postgresql` |
| Restart PostgreSQL | `sudo systemctl restart postgresql` |
| Build frontend | `npm run build` |
| Activate Python venv | `source venv/bin/activate` |
| Install backend deps | `pip install -r requirements.txt` |
| Install frontend deps | `npm install` |

---

## 🏠 Your 11 Units

After seeding, these houses are created automatically:

| Unit | Type | Default Rent |
|------|------|-------------|
| Bedsitter B1 | Bedsitter | KES 8,000 |
| Bedsitter B2 | Bedsitter | KES 8,000 |
| Bedsitter B3 | Bedsitter | KES 8,000 |
| Bedsitter B4 | Bedsitter | KES 8,000 |
| Bedsitter B5 | Bedsitter | KES 8,500 |
| Bedsitter B6 | Bedsitter | KES 8,000 |
| Single S1 | Single Room | KES 5,500 |
| Single S2 | Single Room | KES 5,500 |
| Single S3 | Single Room | KES 5,500 |
| Single S4 | Single Room | KES 5,500 |
| Single S5 | Single Room | KES 5,500 |

Edit rent amounts from the Houses page after login.

---

## 🔒 Security Notes

- All routes require JWT authentication (except `/api/auth/login`)
- Tenant private notes are only visible when logged in
- JWT tokens expire after 8 hours
- Passwords are hashed with bcrypt
- Use HTTPS in production (Let's Encrypt is free)
- Keep your `.env` file secret — never commit it to Git

---

*Murithi Family Rental Management · Meru, Kenya 🇰🇪*
