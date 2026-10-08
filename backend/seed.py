import random
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

import models

CATALOGUE = [
    {"name": "Cyber Hoodie (Black)", "category": "Hoodies", "price": "6,200 LEK",
     "description": "Heavyweight cotton. Reinforced stitching.",
     "colors": ["#141E30", "#243B55"], "badge": "🔥 BEST SELLER", "stock": 15,
     "sizes": ["M", "L", "XL"]},
    {"name": "Distressed Bomber", "category": "Jackets", "price": "8,500 LEK",
     "description": "Vintage wash pilot jacket. Oversized fit.",
     "colors": ["#3E5151", "#DECBA4"], "badge": "⚡ LIMITED", "stock": 4,
     "sizes": ["L", "XL"]},
    {"name": "Gothic Velour Zip", "category": "Hoodies", "price": "5,800 LEK",
     "description": "Soft velour with chrome zipper pull.",
     "colors": ["#000000", "#434343"], "badge": "NEW", "stock": 50,
     "sizes": ["S", "M", "L"]},
    {"name": "Cargo Tech Pants", "category": "Pants", "price": "4,900 LEK",
     "description": "Water-resistant with 6 magnetic pockets.",
     "colors": ["#1f4037", "#99f2c8"], "badge": None, "stock": 20,
     "sizes": ["30", "32", "34"]},
    {"name": "Vintage Denim", "category": "Pants", "price": "5,500 LEK",
     "description": "90s wash with knee distressing.",
     "colors": ["#4568DC", "#B06AB3"], "badge": "🎨 CUSTOM", "stock": 8,
     "sizes": ["30", "32", "34"]},
    {"name": "Chrome Cross Chain", "category": "Jewelry", "price": "2,500 LEK",
     "description": "Stainless steel. Never rusts.",
     "colors": ["#bdc3c7", "#2c3e50"], "badge": None, "stock": 100,
     "sizes": ["One Size"]},
    {"name": "Skull Ring Set", "category": "Jewelry", "price": "1,500 LEK",
     "description": "Set of 3 rings.",
     "colors": ["#304352", "#d7d2cc"], "badge": "LOW STOCK", "stock": 3,
     "sizes": ["7", "8", "9"]},
    {"name": "POLEX Watch", "category": "Accessories", "price": "12,000 LEK",
     "description": "Titanium luxury.",
     "colors": ["#2C3E50", "#4CA1AF"], "badge": "💎 PREMIUM", "stock": 5,
     "sizes": ["Adjustable"]},
    {"name": "Leather Cuff", "category": "Accessories", "price": "1,800 LEK",
     "description": "Genuine leather with metal spikes.",
     "colors": ["#000000", "#550000"], "badge": None, "stock": 15,
     "sizes": ["Adjustable"]},
]

CUSTOMER_NAMES = [
    "Arlind Hoxha", "Elira Deda", "Gentian Prifti", "Ilir Basha", "Klodia Mehmeti",
    "Nadir Krasniqi", "Redi Cela", "Sara Lika", "Endrit Duka", "Mira Kola",
    "Fatjon Rexha", "Dea Alban", "Blendi Zeka", "Eriona Sula", "Renato Gjoka",
    "Arta Hyseni", "Dorian Meta", "Lira Bregu", "Perlitan Dema", "Sidorela Vesa",
]

ADDRESSES = [
    "Rr. Myslym Shyri, Tirana", "Blloku, Rr. Ibrahim Rugova, Tirana",
    "Kashar, Tirana", "Komuna e Parisit, Tirana", "Rr. e Kavajës, Tirana",
    "Ndërkombëtare, Rr. Dritan Hoxha, Tirana", "Lapraka, Tirana",
    "Rr. Hoxha Tahsim, Durrës", "Llogara, Vlorë", "Rr. Bulevardi i Republikës, Shkodër",
]

DEMO_ORDERS = 90
DEMO_WINDOW_DAYS = 45


def price_to_lek(price: str) -> int:
    digits = "".join(ch for ch in str(price) if ch.isdigit())
    return int(digits) if digits else 0


def seed_products(db: Session) -> None:
    if db.query(models.Product).count() > 0:
        return
    print("⚡ Database is empty. Seeding Climax products...")
    db.add_all([models.Product(**product) for product in CATALOGUE])
    db.commit()
    print("✅ Product catalogue seeded.")


def seed_demo_orders(db: Session) -> None:
    """Fill the order history so analytics, charts and Power BI exports
    have realistic data to work with. Flagged with is_demo = True."""
    current = db.query(models.Order).count()
    if current >= DEMO_ORDERS:
        return

    print(f"⚡ Seeding {DEMO_ORDERS - current} demo orders for analytics...")
    rng = random.Random(42)
    products = db.query(models.Product).all()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    statuses = ["Delivered", "Shipped", "Pending", "Confirmed"]
    status_weights = [70, 15, 10, 5]

    orders: List[models.Order] = []
    for _ in range(DEMO_ORDERS - current):
        placed = today - timedelta(days=rng.randrange(DEMO_WINDOW_DAYS))
        placed = placed.replace(hour=rng.randrange(9, 22), minute=rng.randrange(60))

        items = []
        for product in rng.sample(products, rng.randrange(1, 4)):
            unit_price = price_to_lek(product.price)
            qty = rng.choice([1, 1, 1, 2, 2, 3])
            items.append({
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "price": product.price,
                "unit_price": unit_price,
                "size": rng.choice(product.sizes),
                "qty": qty,
            })

        orders.append(models.Order(
            customer_name=rng.choice(CUSTOMER_NAMES),
            address=rng.choice(ADDRESSES),
            phone=f"+355 6{rng.randrange(10, 100)} {rng.randrange(100, 1000)} {rng.randrange(1000, 10000)}",
            total_price=sum(item["unit_price"] * item["qty"] for item in items),
            items=items,
            status=rng.choices(statuses, weights=status_weights, k=1)[0],
            created_at=placed,
            is_demo=True,
        ))

    db.add_all(orders)
    db.commit()
    print("✅ Demo order history seeded.")


def seed_all(db: Session) -> None:
    seed_products(db)
    seed_demo_orders(db)
