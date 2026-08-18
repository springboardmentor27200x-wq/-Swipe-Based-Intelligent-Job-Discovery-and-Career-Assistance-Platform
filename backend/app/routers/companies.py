from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=List[schemas.CompanyOut])
def list_companies(
    skip: int = 0,
    limit: int = 50,
    type: Optional[models.CompanyType] = None,
    db: Session = Depends(get_db)
):
    return crud.get_companies(db, skip=skip, limit=limit, company_type=type)

@router.get("/{company_id}", response_model=schemas.CompanyOut)
def get_company(company_id: UUID, db: Session = Depends(get_db)):
    company = crud.get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    return company

@router.post("", response_model=schemas.CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.recruiter and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters and admins can create companies"
        )
    return crud.create_company(db, company_in)
