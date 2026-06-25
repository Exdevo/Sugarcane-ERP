from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import logging
from logging.handlers import RotatingFileHandler
import sys
from fastapi.responses import JSONResponse
from logger import logger

from database import engine, Base, SessionLocal
from models.farmer import Farmer
from models.delivery import Delivery
from models.payment import Payment

app = FastAPI(title="Sugarcane ERP API")

@app.on_event("startup")
async def startup_event():
    try:
        engine.connect()
        logger.info("Database connection successful on startup")
    except Exception as e:
        logger.critical(f"Database connection failed on startup: {e}")
        sys.exit(1)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down API server")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# -----------------------------------------------------------------------------
# CORS MIDDLEWARE
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# DB session dependency
def get_db():
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        logger.error(f"Database session creation failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")
    finally:
        db.close()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class FarmerCreate(BaseModel):
    name: str
    phone: str
    national_id: str

class DeliveryCreate(BaseModel):
    farmer_id: int
    tonnage: float
    price_per_ton: float

class PaymentCreate(BaseModel):
    farmer_id: int
    amount: float

# -----------------------------------------------------------------------------
# API ROUTES
# -----------------------------------------------------------------------------

@app.get("/")
def home():
    return {"status": "Sugarcane ERP API is running perfectly"}

# -- Farmers --

@app.post("/farmers")
def create_farmer(farmer: FarmerCreate, db: Session = Depends(get_db)):
    existing = db.query(Farmer).filter(Farmer.national_id == farmer.national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Farmer with this National ID already exists")
    
    new_farmer = Farmer(
        name=farmer.name,
        phone=farmer.phone,
        national_id=farmer.national_id,
        total_tonnage=0.0,
        total_paid=0.0
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    return new_farmer

@app.get("/farmers")
def get_farmers(db: Session = Depends(get_db)):
    return db.query(Farmer).all()

# -- Deliveries --

@app.post("/deliveries")
def add_delivery(delivery: DeliveryCreate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == delivery.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    new_delivery = Delivery(
        farmer_id=delivery.farmer_id,
        tonnage=delivery.tonnage,
        price_per_ton=delivery.price_per_ton
    )
    
    farmer.total_tonnage += delivery.tonnage
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    return {
        "message": "Delivery recorded successfully",
        "delivery": new_delivery,
        "farmer_total_tonnage": farmer.total_tonnage
    }

@app.get("/deliveries")
def get_deliveries(farmer_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Delivery)
    if farmer_id is not None:
        query = query.filter(Delivery.farmer_id == farmer_id)
    return query.order_by(Delivery.id.desc()).all()

# -- Payments --

@app.post("/payments")
def add_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == payment.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    new_payment = Payment(
        farmer_id=payment.farmer_id,
        amount=payment.amount
    )
    
    farmer.total_paid += payment.amount
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return {
        "message": "Payment recorded successfully",
        "payment": new_payment,
        "farmer_total_paid": farmer.total_paid
    }

@app.get("/payments")
def get_payments(farmer_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Payment)
    if farmer_id is not None:
        query = query.filter(Payment.farmer_id == farmer_id)
    return query.order_by(Payment.id.desc()).all()

# -- Dashboard --

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    farmers = db.query(Farmer).all()
    deliveries = db.query(Delivery).all()
    
    total_farmers = len(farmers)
    total_tonnage = sum(f.total_tonnage for f in farmers)
    total_paid = sum(f.total_paid for f in farmers)
    
    # Calculate total value of deliveries: sum of tonnage * price_per_ton for each delivery
    total_value = sum(d.tonnage * d.price_per_ton for d in deliveries)
    pending_balance = max(0.0, total_value - total_paid)
    
    # Recent 5 deliveries & payments
    recent_deliveries = db.query(Delivery).order_by(Delivery.id.desc()).limit(5).all()
    recent_payments = db.query(Payment).order_by(Payment.id.desc()).limit(5).all()
    
    farmer_map = {f.id: f.name for f in farmers}
    
    recent_del_data = []
    for rd in recent_deliveries:
        recent_del_data.append({
            "id": rd.id,
            "farmer_id": rd.farmer_id,
            "farmer_name": farmer_map.get(rd.farmer_id, "Unknown Farmer"),
            "tonnage": rd.tonnage,
            "price_per_ton": rd.price_per_ton,
            "total_value": rd.tonnage * rd.price_per_ton,
            "created_at": rd.created_at
        })
        
    recent_pay_data = []
    for rp in recent_payments:
        recent_pay_data.append({
            "id": rp.id,
            "farmer_id": rp.farmer_id,
            "farmer_name": farmer_map.get(rp.farmer_id, "Unknown Farmer"),
            "amount": rp.amount,
            "created_at": rp.created_at
        })
    
    return {
        "total_farmers": total_farmers,
        "total_tonnage": total_tonnage,
        "total_paid": total_paid,
        "total_value": total_value,
        "pending_balance": pending_balance,
        "recent_deliveries": recent_del_data,
        "recent_payments": recent_pay_data
    }