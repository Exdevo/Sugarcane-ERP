# from sqlalchemy import Column, Integer, String, Float
# from database import Base

# class Farmer(Base):
#     __tablename__ = "farmers"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     phone = Column(String, nullable=False)
#     national_id = Column(String, unique=True, nullable=False)

#     total_tonnage = Column(Float, default=0)
#     total_paid = Column(Float, default=0)




from sqlalchemy import Column, Integer, String, Float
from database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    national_id = Column(String, unique=True, nullable=False)

    total_tonnage = Column(Float, default=0)
    total_paid = Column(Float, default=0)


    