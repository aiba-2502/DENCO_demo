"""タグ管理API"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_tenant
from database import Database

router = APIRouter(prefix="/api/tags", tags=["tags"])
db = Database()

class TagCreate(BaseModel):
    name: str
    color: str  # HEX color code

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

@router.get("")
async def list_tags(tenant = Depends(get_current_tenant)):
    """タグ一覧取得"""
    try:
        tags = await db.get_tags(tenant.id)
        return {
            "status": "success",
            "tags": tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_tag(
    tag: TagCreate,
    tenant = Depends(get_current_tenant)
):
    """タグ作成"""
    try:
        new_tag = await db.create_tag(tenant.id, tag.name, tag.color)
        return {
            "status": "success",
            "tag": new_tag
        }
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="Tag with this name already exists")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tag_id}")
async def update_tag(
    tag_id: str,
    tag: TagUpdate,
    tenant = Depends(get_current_tenant)
):
    """タグ更新"""
    try:
        updated_tag = await db.update_tag(tag_id, tenant.id, tag.dict(exclude_none=True))
        if not updated_tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {
            "status": "success",
            "tag": updated_tag
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: str,
    tenant = Depends(get_current_tenant)
):
    """タグ削除"""
    try:
        await db.delete_tag(tag_id, tenant.id)
        return {
            "status": "success",
            "message": "Tag deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

