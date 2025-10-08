"""顧客管理API"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from auth import get_current_tenant
from database import Database
from models import Customer, Tag

router = APIRouter(prefix="/api/customers", tags=["customers"])
db = Database()

# ==================== Request/Response Models ====================

class CustomerCreate(BaseModel):
    last_name: str
    first_name: str
    last_name_kana: Optional[str] = None
    first_name_kana: Optional[str] = None
    phone_number: str
    fax_number: Optional[str] = None
    email: Optional[str] = None
    postal_code: Optional[str] = None
    prefecture: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tag_ids: Optional[List[str]] = []

class CustomerUpdate(BaseModel):
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name_kana: Optional[str] = None
    first_name_kana: Optional[str] = None
    phone_number: Optional[str] = None
    fax_number: Optional[str] = None
    email: Optional[str] = None
    postal_code: Optional[str] = None
    prefecture: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tag_ids: Optional[List[str]] = None

# ==================== Endpoints ====================

@router.get("")
async def list_customers(
    search: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """顧客一覧取得"""
    try:
        customers = await db.get_customers(
            tenant_id=tenant.id,
            search=search,
            tag_id=tag_id,
            limit=limit,
            offset=offset
        )
        
        total = await db.get_customers_count(tenant.id, search, tag_id)
        
        return {
            "status": "success",
            "customers": customers,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}")
async def get_customer(
    customer_id: str,
    tenant = Depends(get_current_tenant)
):
    """顧客詳細取得"""
    try:
        customer = await db.get_customer(customer_id, tenant.id)
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {
            "status": "success",
            "customer": customer
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_customer(
    customer: CustomerCreate,
    tenant = Depends(get_current_tenant)
):
    """顧客作成"""
    try:
        # 電話番号の重複チェック
        existing = await db.get_customer_by_phone(customer.phone_number, tenant.id)
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )
        
        new_customer = await db.create_customer(
            tenant_id=tenant.id,
            **customer.dict(exclude={'tag_ids'})
        )
        
        # タグを関連付け
        if customer.tag_ids:
            await db.add_customer_tags(new_customer['id'], customer.tag_ids)
        
        # タグ情報を含めて顧客情報を再取得
        customer_with_tags = await db.get_customer(new_customer['id'], tenant.id)
        
        return {
            "status": "success",
            "customer": customer_with_tags
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{customer_id}")
async def update_customer(
    customer_id: str,
    customer: CustomerUpdate,
    tenant = Depends(get_current_tenant)
):
    """顧客更新"""
    try:
        # 顧客の存在確認
        existing = await db.get_customer(customer_id, tenant.id)
        if not existing:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # 電話番号変更時の重複チェック
        if customer.phone_number and customer.phone_number != existing['phone_number']:
            duplicate = await db.get_customer_by_phone(customer.phone_number, tenant.id)
            if duplicate and duplicate['id'] != customer_id:
                raise HTTPException(
                    status_code=400,
                    detail="Customer with this phone number already exists"
                )
        
        # 顧客情報を更新
        updated_data = {k: v for k, v in customer.dict(exclude={'tag_ids'}).items() if v is not None}
        await db.update_customer(customer_id, tenant.id, updated_data)
        
        # タグを更新
        if customer.tag_ids is not None:
            await db.remove_customer_tags(customer_id)
            if customer.tag_ids:
                await db.add_customer_tags(customer_id, customer.tag_ids)
        
        # 更新後の顧客情報を取得
        updated_customer = await db.get_customer(customer_id, tenant.id)
        
        return {
            "status": "success",
            "customer": updated_customer
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    tenant = Depends(get_current_tenant)
):
    """顧客削除"""
    try:
        # 顧客の存在確認
        customer = await db.get_customer(customer_id, tenant.id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        await db.delete_customer(customer_id, tenant.id)
        
        return {
            "status": "success",
            "message": "Customer deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}/call-history")
async def get_customer_call_history(
    customer_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """顧客の通話履歴取得"""
    try:
        # 顧客の存在確認
        customer = await db.get_customer(customer_id, tenant.id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # 通話履歴を取得
        call_history = await db.get_customer_call_history(
            customer_id=customer_id,
            limit=limit,
            offset=offset
        )
        
        total = await db.get_customer_call_history_count(customer_id)
        
        return {
            "status": "success",
            "call_history": call_history,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

