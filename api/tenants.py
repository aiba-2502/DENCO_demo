"""テナント管理API"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_tenant
from database import Database

router = APIRouter(prefix="/api/tenants", tags=["tenants"])
db = Database()

class TenantCreate(BaseModel):
    name: str
    azure_speech_key: str
    azure_speech_region: str
    dify_api_key: str
    dify_endpoint: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    azure_speech_key: Optional[str] = None
    azure_speech_region: Optional[str] = None
    dify_api_key: Optional[str] = None
    dify_endpoint: Optional[str] = None

@router.get("")
async def list_tenants():
    """テナント一覧取得（管理者のみ）"""
    try:
        tenants = await db.get_all_tenants()
        return {
            "status": "success",
            "tenants": tenants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tenant_id}")
async def get_tenant_detail(tenant_id: str):
    """テナント詳細取得"""
    try:
        tenant = await db.get_tenant(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return {
            "status": "success",
            "tenant": tenant
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_tenant(tenant: TenantCreate):
    """テナント作成（管理者のみ）"""
    try:
        new_tenant = await db.create_tenant(**tenant.dict())
        return {
            "status": "success",
            "tenant": new_tenant
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    tenant: TenantUpdate
):
    """テナント更新（管理者のみ）"""
    try:
        updated_data = {k: v for k, v in tenant.dict().items() if v is not None}
        updated_tenant = await db.update_tenant(tenant_id, updated_data)
        
        if not updated_tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        return {
            "status": "success",
            "tenant": updated_tenant
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: str):
    """テナント削除（管理者のみ）"""
    try:
        await db.delete_tenant(tenant_id)
        return {
            "status": "success",
            "message": "Tenant deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

