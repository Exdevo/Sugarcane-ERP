from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from datetime import datetime
from database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    amount = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)