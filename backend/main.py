from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# import database tools
import models
from database import SessionLocal, engine

# 1. THE DATABASE TABLES
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 2. CORS(Security)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. DATA SCHEMA (what the API sends/receives)


class OrderSchema(BaseModel):
    customer_name: str
    address: str
    phone: str
    total_price: int
    items: List[dict]  # needs to match the structure of items in my cart

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    id: int
    name: str
    category: str
    price: str
    description: str
    colors: List[str]
    badge: Optional[str] = None
    stock: int
    sizes: List[str]

    class Config:
        from_attributes = True  # tells pydantic to read from SQL models

# DEPENDENCY


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# INITIAL DATA SEEDING


def seed_database(db: Session):
    count = db.query(models.Product).count()
    if count == 0:
        print("⚡ Database is empty. Seeding Climax products...")
        initial_products = [
            models.Product(name="Cyber Hoodie (Black)", category="Hoodies", price="6,200 LEK", description="Heavyweight cotton. Reinforced stitching.", colors=[
                           "#141E30", "#243B55"], badge="🔥 BEST SELLER", stock=15, sizes=["M", "L", "XL"]),
            models.Product(name="Distressed Bomber", category="Jackets", price="8,500 LEK", description="Vintage wash pilot jacket. Oversized fit.", colors=[
                           "#3E5151", "#DECBA4"], badge="⚡ LIMITED", stock=4, sizes=["L", "XL"]),
            models.Product(name="Gothic Velour Zip", category="Hoodies", price="5,800 LEK", description="Soft velour with chrome zipper pull.", colors=[
                           "#000000", "#434343"], badge="NEW", stock=50, sizes=["S", "M", "L"]),
            models.Product(name="Cargo Tech Pants", category="Pants", price="4,900 LEK", description="Water-resistant with 6 magnetic pockets.",
                           colors=["#1f4037", "#99f2c8"], badge=None, stock=20, sizes=["30", "32", "34"]),
            models.Product(name="Vintage Denim", category="Pants", price="5,500 LEK", description="90s wash with knee distressing.", colors=[
                           "#4568DC", "#B06AB3"], badge="🎨 CUSTOM", stock=8, sizes=["30", "32", "34"]),
            models.Product(name="Chrome Cross Chain", category="Jewelry", price="2,500 LEK", description="Stainless steel. Never rusts.", colors=[
                           "#bdc3c7", "#2c3e50"], badge=None, stock=100, sizes=["One Size"]),
            models.Product(name="Skull Ring Set", category="Jewelry", price="1,500 LEK", description="Set of 3 rings.", colors=[
                           "#304352", "#d7d2cc"], badge="LOW STOCK", stock=3, sizes=["7", "8", "9"]),
            models.Product(name="POLEX Watch", category="Accessories", price="12,000 LEK", description="Titanium luxury.", colors=[
                           "#2C3E50", "#4CA1AF"], badge="💎 PREMIUM", stock=5, sizes=["Adjustable"]),
            models.Product(name="Leather Cuff", category="Accessories", price="1,800 LEK", description="Genuine leather with metal spikes.", colors=[
                           "#000000", "#550000"], badge=None, stock=15, sizes=["Adjustable"])
        ]
        db.add_all(initial_products)
        db.commit()
        print("✅ Seeding complete!")

# 5. API ENDPOINTS


@app.on_event("startup")
def on_startup():
    # helps seed data when app starts
    db = SessionLocal()
    seed_database(db)
    db.close()


@app.get("/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return products


@app.post("/products", response_model=ProductSchema)
def create_product(product: ProductSchema, db: Session = Depends(get_db)):
    # simple endpoint to add products via code or postman later
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.post("/orders")
def create_order(order: OrderSchema, db: Session = Depends(get_db)):
    # new order in database
    new_order = models.Order(
        customer_name=order.customer_name,
        address=order.address,
        phone=order.phone,
        total_price=order.total_price,
        items=order.items,
        status="Confirmed"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return {"status": "success", "order_id": new_order.id}
