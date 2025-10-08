from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CallSession(BaseModel):
    id: str
    tenant_id: str
    from_number: str
    to_number: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    
class Message(BaseModel):
    id: str
    call_id: str
    content: str
    type: str  # "user" or "ai"
    created_at: datetime
    
class Tenant(BaseModel):
    id: str
    name: str
    azure_speech_key: str
    azure_speech_region: str
    dify_api_key: str
    dify_endpoint: str
    created_at: datetime
    
class User(BaseModel):
    id: str
    tenant_id: str
    name: str
    phone_number: str
    email: str
    created_at: datetime

class FaxDocument(BaseModel):
    id: str
    tenant_id: str
    direction: str  # "inbound" or "outbound"
    sender_number: str
    receiver_number: str
    status: str
    tiff_path: Optional[str]
    pdf_path: Optional[str]
    ocr_text: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
    error_message: Optional[str]

# ==================== 顧客管理 ====================

class Tag(BaseModel):
    id: str
    tenant_id: str
    name: str
    color: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class Customer(BaseModel):
    id: str
    tenant_id: str
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
    tags: Optional[List[Tag]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==================== ナレッジ ====================

class KnowledgeCategory(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

class KnowledgeArticle(BaseModel):
    id: str
    tenant_id: str
    category_id: Optional[str] = None
    title: str
    content: str
    relevance_score: float = 0.0
    views_count: int = 0
    tags: Optional[List[Tag]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

class CustomerInquiry(BaseModel):
    id: str
    tenant_id: str
    customer_id: str
    call_session_id: Optional[str] = None
    category_id: Optional[str] = None
    summary: str
    call_duration: Optional[int] = None
    status: str = "open"  # open, resolved, follow_up
    priority: str = "medium"  # low, medium, high
    tags: Optional[List[Tag]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==================== AI架電 ====================

class CallTemplate(BaseModel):
    id: str
    tenant_id: str
    name: str
    type: str  # text, audio
    content: Optional[str] = None
    audio_url: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class CallCampaign(BaseModel):
    id: str
    tenant_id: str
    template_id: str
    name: str
    status: str = "draft"  # draft, scheduled, in_progress, completed, cancelled
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_targets: int = 0
    completed_calls: int = 0
    failed_calls: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

class CallCampaignLog(BaseModel):
    id: str
    campaign_id: str
    customer_id: str
    call_session_id: Optional[str] = None
    status: str  # completed, failed, no_answer, busy
    result: Optional[str] = None
    duration: Optional[int] = None
    attempted_at: datetime
    completed_at: Optional[datetime] = None

# ==================== 通知 ====================

class NotificationSetting(BaseModel):
    id: str
    tenant_id: str
    name: str
    event_type: str
    conditions: Optional[dict] = None
    enabled: bool = True
    notification_methods: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==================== スタッフ ====================

class Department(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

class Staff(BaseModel):
    id: str
    tenant_id: str
    department_id: Optional[str] = None
    name: str
    email: str
    phone_number: Optional[str] = None
    extension_number: Optional[str] = None
    role: Optional[str] = None
    status: str = "active"
    created_at: datetime
    updated_at: Optional[datetime] = None

# ==================== 番号管理 ====================

class PhoneNumber(BaseModel):
    id: str
    tenant_id: str
    number: str
    type: str  # inbound, outbound, both
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime