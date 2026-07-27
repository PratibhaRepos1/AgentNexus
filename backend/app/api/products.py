from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..models.user import User
from ..models.product import Product
from ..schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[ProductOut])
def list_products(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.business_id == current_user.business_id).all()


@router.post("", response_model=ProductOut)
def create_product(
    body: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = Product(business_id=current_user.business_id, **body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    body: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id, Product.business_id == current_user.business_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(product, field, val)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id, Product.business_id == current_user.business_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}
