from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from datetime import datetime
from database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    tonnage = Column(Float, nullable=False)
    price_per_ton = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)