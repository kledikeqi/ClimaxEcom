from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String

from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    price = Column(String)
    description = Column(String)
    colors = Column(JSON)
    badge = Column(String, nullable=True)
    stock = Column(Integer, default=10)
    sizes = Column(JSON, default=["S", "M", "XL"])


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    address = Column(String)
    phone = Column(String)
    total_price = Column(Integer)
    items = Column(JSON)  # cart payload: list of item dicts
    status = Column(String, default="Pending")  # Pending, Confirmed, Shipped, Delivered
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, nullable=False)
