"""AI架電キャンペーンAPI"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from auth import get_current_tenant
from database import Database

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])
db = Database()

class TemplateCreate(BaseModel):
    name: str
    type: str  # text, audio
    content: Optional[str] = None
    audio_url: Optional[str] = None
    description: Optional[str] = None

class CampaignCreate(BaseModel):
    template_id: str
    name: str
    customer_ids: List[str]
    scheduled_at: Optional[datetime] = None

# ==================== テンプレート ====================

@router.get("/templates")
async def list_templates(tenant = Depends(get_current_tenant)):
    """テンプレート一覧取得"""
    try:
        templates = await db.get_call_templates(tenant.id)
        return {
            "status": "success",
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def create_template(
    template: TemplateCreate,
    tenant = Depends(get_current_tenant)
):
    """テンプレート作成"""
    try:
        new_template = await db.create_call_template(tenant.id, **template.dict())
        return {
            "status": "success",
            "template": new_template
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    tenant = Depends(get_current_tenant)
):
    """テンプレート削除"""
    try:
        await db.delete_call_template(template_id, tenant.id)
        return {
            "status": "success",
            "message": "Template deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== キャンペーン ====================

@router.get("")
async def list_campaigns(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """キャンペーン一覧取得"""
    try:
        campaigns = await db.get_call_campaigns(tenant.id, status, limit, offset)
        total = await db.get_call_campaigns_count(tenant.id, status)
        
        return {
            "status": "success",
            "campaigns": campaigns,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_campaign(
    campaign: CampaignCreate,
    tenant = Depends(get_current_tenant)
):
    """キャンペーン作成"""
    try:
        new_campaign = await db.create_call_campaign(
            tenant_id=tenant.id,
            template_id=campaign.template_id,
            name=campaign.name,
            customer_ids=campaign.customer_ids,
            scheduled_at=campaign.scheduled_at
        )
        
        return {
            "status": "success",
            "campaign": new_campaign
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    tenant = Depends(get_current_tenant)
):
    """キャンペーン開始"""
    try:
        await db.update_campaign_status(campaign_id, tenant.id, "in_progress", started_at=datetime.utcnow())
        
        # TODO: 実際の発信処理をNode.jsバックエンドに依頼
        
        return {
            "status": "success",
            "message": "Campaign started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{campaign_id}/logs")
async def get_campaign_logs(
    campaign_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """キャンペーンログ取得"""
    try:
        logs = await db.get_campaign_logs(campaign_id, limit, offset)
        total = await db.get_campaign_logs_count(campaign_id)
        
        return {
            "status": "success",
            "logs": logs,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

