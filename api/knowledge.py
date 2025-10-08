"""ナレッジデータベースAPI"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from auth import get_current_tenant
from database import Database

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
db = Database()

# ==================== Request Models ====================

class KnowledgeArticleCreate(BaseModel):
    category_id: Optional[str] = None
    title: str
    content: str
    tag_ids: Optional[List[str]] = []

class KnowledgeArticleUpdate(BaseModel):
    category_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tag_ids: Optional[List[str]] = None

class InquiryCreate(BaseModel):
    customer_id: str
    call_session_id: Optional[str] = None
    category_id: Optional[str] = None
    summary: str
    call_duration: Optional[int] = None
    status: str = "open"
    priority: str = "medium"
    tag_ids: Optional[List[str]] = []

class InquiryUpdate(BaseModel):
    category_id: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    tag_ids: Optional[List[str]] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

# ==================== ナレッジ記事 ====================

@router.get("/articles")
async def list_articles(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """ナレッジ記事一覧取得"""
    try:
        articles = await db.get_knowledge_articles(
            tenant_id=tenant.id,
            search=search,
            category_id=category_id,
            tag_id=tag_id,
            limit=limit,
            offset=offset
        )
        
        total = await db.get_knowledge_articles_count(tenant.id, search, category_id, tag_id)
        
        return {
            "status": "success",
            "articles": articles,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/articles")
async def create_article(
    article: KnowledgeArticleCreate,
    tenant = Depends(get_current_tenant)
):
    """ナレッジ記事作成"""
    try:
        new_article = await db.create_knowledge_article(
            tenant_id=tenant.id,
            **article.dict(exclude={'tag_ids'})
        )
        
        if article.tag_ids:
            await db.add_article_tags(new_article['id'], article.tag_ids)
        
        article_with_tags = await db.get_knowledge_article(new_article['id'], tenant.id)
        
        return {
            "status": "success",
            "article": article_with_tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/articles/{article_id}")
async def update_article(
    article_id: str,
    article: KnowledgeArticleUpdate,
    tenant = Depends(get_current_tenant)
):
    """ナレッジ記事更新"""
    try:
        updated_data = {k: v for k, v in article.dict(exclude={'tag_ids'}).items() if v is not None}
        await db.update_knowledge_article(article_id, tenant.id, updated_data)
        
        if article.tag_ids is not None:
            await db.remove_article_tags(article_id)
            if article.tag_ids:
                await db.add_article_tags(article_id, article.tag_ids)
        
        updated_article = await db.get_knowledge_article(article_id, tenant.id)
        
        return {
            "status": "success",
            "article": updated_article
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: str,
    tenant = Depends(get_current_tenant)
):
    """ナレッジ記事削除"""
    try:
        await db.delete_knowledge_article(article_id, tenant.id)
        return {
            "status": "success",
            "message": "Article deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== お問い合わせ ====================

@router.get("/inquiries")
async def list_inquiries(
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant = Depends(get_current_tenant)
):
    """お問い合わせ一覧取得"""
    try:
        inquiries = await db.get_customer_inquiries(
            tenant_id=tenant.id,
            customer_id=customer_id,
            status=status,
            priority=priority,
            limit=limit,
            offset=offset
        )
        
        total = await db.get_customer_inquiries_count(tenant.id, customer_id, status, priority)
        
        return {
            "status": "success",
            "inquiries": inquiries,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inquiries")
async def create_inquiry(
    inquiry: InquiryCreate,
    tenant = Depends(get_current_tenant)
):
    """お問い合わせ作成"""
    try:
        new_inquiry = await db.create_customer_inquiry(
            tenant_id=tenant.id,
            **inquiry.dict(exclude={'tag_ids'})
        )
        
        if inquiry.tag_ids:
            await db.add_inquiry_tags(new_inquiry['id'], inquiry.tag_ids)
        
        inquiry_with_tags = await db.get_customer_inquiry(new_inquiry['id'], tenant.id)
        
        return {
            "status": "success",
            "inquiry": inquiry_with_tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/inquiries/{inquiry_id}")
async def update_inquiry(
    inquiry_id: str,
    inquiry: InquiryUpdate,
    tenant = Depends(get_current_tenant)
):
    """お問い合わせ更新"""
    try:
        updated_data = {k: v for k, v in inquiry.dict(exclude={'tag_ids'}).items() if v is not None}
        await db.update_customer_inquiry(inquiry_id, tenant.id, updated_data)
        
        if inquiry.tag_ids is not None:
            await db.remove_inquiry_tags(inquiry_id)
            if inquiry.tag_ids:
                await db.add_inquiry_tags(inquiry_id, inquiry.tag_ids)
        
        updated_inquiry = await db.get_customer_inquiry(inquiry_id, tenant.id)
        
        return {
            "status": "success",
            "inquiry": updated_inquiry
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== カテゴリー ====================

@router.get("/categories")
async def list_categories(tenant = Depends(get_current_tenant)):
    """カテゴリー一覧取得"""
    try:
        categories = await db.get_knowledge_categories(tenant.id)
        return {
            "status": "success",
            "categories": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
async def create_category(
    category: CategoryCreate,
    tenant = Depends(get_current_tenant)
):
    """カテゴリー作成"""
    try:
        new_category = await db.create_knowledge_category(tenant.id, category.name, category.description)
        return {
            "status": "success",
            "category": new_category
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    tenant = Depends(get_current_tenant)
):
    """カテゴリー削除"""
    try:
        await db.delete_knowledge_category(category_id, tenant.id)
        return {
            "status": "success",
            "message": "Category deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

