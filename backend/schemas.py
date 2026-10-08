from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ProductSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    price: str
    description: str
    colors: List[str]
    badge: Optional[str] = None
    stock: int
    sizes: List[str]


class ProductCreateSchema(BaseModel):
    name: str
    category: str
    price: str
    description: str = ""
    colors: List[str] = ["#333333", "#444444"]
    badge: Optional[str] = None
    stock: int = 10
    sizes: List[str] = ["S", "M", "L"]


class OrderCreateSchema(BaseModel):
    customer_name: str
    address: str
    phone: str
    total_price: int
    items: List[dict]


class OrderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    address: str
    phone: str
    total_price: int
    items: List[dict]
    status: str
    created_at: Optional[datetime] = None
    is_demo: bool = False
