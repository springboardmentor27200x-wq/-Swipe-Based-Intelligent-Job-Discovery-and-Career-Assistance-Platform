from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.auth.utils import require_role
from app.jobs.schemas import CompanyResponse, CompanyCreate

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("/", response_model=List[CompanyResponse])
def list_companies(
    company_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all companies (used to populate job-posting forms and filters)."""
    query = db.query(Company)
    if company_type:
        query = query.filter(Company.company_type == company_type)
    return query.order_by(Company.name.asc()).all()


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get a single company's details."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Create a new company (recruiter/admin only)."""
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
