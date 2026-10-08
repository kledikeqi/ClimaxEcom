from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    total_price: int = Field(gt=0)
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
    user_id: Optional[int] = None
    payment_method: Optional[str] = None


class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = ""


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_admin: bool


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchema


class DemoCardSchema(BaseModel):
    number: str
    exp: str
    cvc: str


class DemoPaySchema(OrderCreateSchema):
    card: DemoCardSchema
