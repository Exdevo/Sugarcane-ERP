from pydantic import BaseModel

class FarmerCreate(BaseModel):
    name: str
    phone: str
    farm_size: float
    region: str


class HarvestCreate(BaseModel):
    farmer_id: int
    tons: float
    price_per_ton: float