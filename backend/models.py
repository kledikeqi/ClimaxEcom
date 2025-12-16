from sqlalchemy import Column, Integer, String, JSON
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    price = Column(String)
    description = Column(String)
    colors = Column(JSON)
    badge = Column(String, nullable=True)
    stock = Column(Integer, default=10)
    sizes = Column(JSON, default=["S", "M", "L"])


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    address = Column(String)
    phone = Column(String)
    total_price = Column(Integer)
    items = Column(JSON)  # we save the cart items as a list
    #  Pending, Shipped, Delivered
    status = Column(String, default="Pending")
