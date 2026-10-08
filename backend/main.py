import os
from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from analytics import router as analytics_router
from auth import auth_router, get_current_user, require_admin
from database import Base, SessionLocal, engine, get_db, run_migrations
from payments import payments_router
from seed import seed_all


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Climax API", description="Gothic streetwear storefront API", version="1.1.0", lifespan=lifespan)

# CORS. Override in production with a comma separated list, e.g.
# CORS_ORIGINS="https://climax.example.com,https://www.example.com"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(payments_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "climax-api"}


@app.get("/products", response_model=List[schemas.ProductSchema])
def get_products(db: Session = Depends(get_db)) -> List[models.Product]:
    return db.query(models.Product).all()


@app.post("/products", response_model=schemas.ProductSchema, status_code=201)
def create_product(
    product: schemas.ProductCreateSchema,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> models.Product:
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.post("/orders")
def create_order(
    order: schemas.OrderCreateSchema,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> dict:
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")
    new_order = models.Order(
        customer_name=order.customer_name,
        address=order.address,
        phone=order.phone,
        total_price=order.total_price,
        items=order.items,
        status="Confirmed",
        is_demo=False,
        user_id=user.id,
        payment_method="cod",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return {"status": "success", "order_id": new_order.id}


@app.get("/orders/mine")
def my_orders(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list:
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [schemas.OrderSchema.model_validate(o).model_dump() for o in orders]
