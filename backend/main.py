from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, houses, tenants, payments
from dotenv import load_dotenv
import os

load_dotenv()

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Murithi Rental Management API",
    description="Full-featured rental property management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://rental-man.netlify.app",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router,     prefix="/api/auth",     tags=["🔐 Authentication"])
app.include_router(houses.router,   prefix="/api/houses",   tags=["🏠 Houses"])
app.include_router(tenants.router,  prefix="/api/tenants",  tags=["👤 Tenants"])
app.include_router(payments.router, prefix="/api/payments", tags=["💰 Payments"])


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Kamau Rental Management API",
        "docs": "/docs",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "healthy"}
