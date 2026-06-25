from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    farm_size = Column(Float)
    region = Column(String)


class Harvest(Base):
    __tablename__ = "harvests"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    tons = Column(Float)
    price_per_ton = Column(Float)
    total_value = Column(Float)
    date = Column(String)