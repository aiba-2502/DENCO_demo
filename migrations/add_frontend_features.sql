-- フロントエンド機能用テーブル追加
-- 顧客管理、ナレッジ、AI架電、通知設定など

-- ==================== 顧客管理 ====================

-- タグマスタテーブル
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- HEX color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_tenant_id ON tags(tenant_id);

-- 顧客テーブル（拡張版）
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name_kana VARCHAR(50),
    first_name_kana VARCHAR(50),
    phone_number VARCHAR(20) NOT NULL,
    fax_number VARCHAR(20),
    email VARCHAR(255),
    postal_code VARCHAR(10),
    prefecture VARCHAR(10),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);

-- 顧客タグ関連テーブル
CREATE TABLE IF NOT EXISTS customer_tags (
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag_id ON customer_tags(tag_id);

-- ==================== ナレッジデータベース ====================

-- ナレッジカテゴリー
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_tenant_id ON knowledge_categories(tenant_id);

-- ナレッジ記事
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tenant_id ON knowledge_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category_id ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_title ON knowledge_articles USING gin(to_tsvector('japanese', title));
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_content ON knowledge_articles USING gin(to_tsvector('japanese', content));

-- ナレッジ記事タグ関連
CREATE TABLE IF NOT EXISTS knowledge_article_tags (
    article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_article_tags_article_id ON knowledge_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_article_tags_tag_id ON knowledge_article_tags(tag_id);

-- 顧客お問い合わせ履歴
CREATE TABLE IF NOT EXISTS customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE SET NULL,
    category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    call_duration INTEGER, -- seconds
    status VARCHAR(20) DEFAULT 'open', -- open, resolved, follow_up
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_tenant_id ON customer_inquiries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_customer_id ON customer_inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_call_session_id ON customer_inquiries(call_session_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

-- お問い合わせタグ関連
CREATE TABLE IF NOT EXISTS inquiry_tags (
    inquiry_id UUID NOT NULL REFERENCES customer_inquiries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (inquiry_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_inquiry_tags_inquiry_id ON inquiry_tags(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_tags_tag_id ON inquiry_tags(tag_id);

-- ==================== AI架電機能 ====================

-- AI架電テンプレート
CREATE TABLE IF NOT EXISTS call_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- text, audio
    content TEXT, -- テキストテンプレートの場合
    audio_url TEXT, -- 音声テンプレートの場合
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_call_templates_tenant_id ON call_templates(tenant_id);

-- AI架電キャンペーン
CREATE TABLE IF NOT EXISTS call_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES call_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, in_progress, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_targets INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_campaigns_tenant_id ON call_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_campaigns_status ON call_campaigns(status);

-- AI架電ログ
CREATE TABLE IF NOT EXISTS call_campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES call_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL, -- completed, failed, no_answer, busy
    result TEXT,
    duration INTEGER, -- seconds
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_call_campaign_logs_campaign_id ON call_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_campaign_logs_customer_id ON call_campaign_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_campaign_logs_status ON call_campaign_logs(status);

-- ==================== 通知設定 ====================

-- 通知設定
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- call_missed, call_failed, long_call, etc.
    conditions JSONB, -- 通知条件（JSON形式）
    enabled BOOLEAN DEFAULT TRUE,
    notification_methods JSONB, -- 通知方法（email, slack, webhook等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_tenant_id ON notification_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_event_type ON notification_settings(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON notification_settings(enabled);

-- 通知履歴
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_setting_id UUID NOT NULL REFERENCES notification_settings(id) ON DELETE CASCADE,
    event_data JSONB,
    sent_to TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- sent, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_setting_id ON notification_logs(notification_setting_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- ==================== スタッフ・部署管理 ====================

-- 部署
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON departments(tenant_id);

-- スタッフ
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    extension_number VARCHAR(10),
    role VARCHAR(50), -- admin, operator, manager
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- ==================== 番号管理 ====================

-- 電話番号管理
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL, -- inbound, outbound, both
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(number)
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_tenant_id ON phone_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_is_active ON phone_numbers(is_active);

-- ==================== 統計ビュー ====================

-- 顧客統計ビュー
CREATE OR REPLACE VIEW customer_statistics AS
SELECT 
    c.tenant_id,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN c.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_30d,
    COUNT(CASE WHEN c.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_customers_7d,
    COUNT(DISTINCT ct.tag_id) as total_tags_used
FROM customers c
LEFT JOIN customer_tags ct ON c.id = ct.customer_id
GROUP BY c.tenant_id;

-- ナレッジ統計ビュー
CREATE OR REPLACE VIEW knowledge_statistics AS
SELECT 
    ka.tenant_id,
    COUNT(*) as total_articles,
    SUM(ka.views_count) as total_views,
    AVG(ka.relevance_score) as avg_relevance_score,
    COUNT(DISTINCT ka.category_id) as total_categories
FROM knowledge_articles ka
GROUP BY ka.tenant_id;

-- お問い合わせ統計ビュー
CREATE OR REPLACE VIEW inquiry_statistics AS
SELECT 
    ci.tenant_id,
    COUNT(*) as total_inquiries,
    COUNT(CASE WHEN ci.status = 'open' THEN 1 END) as open_inquiries,
    COUNT(CASE WHEN ci.status = 'resolved' THEN 1 END) as resolved_inquiries,
    COUNT(CASE WHEN ci.status = 'follow_up' THEN 1 END) as follow_up_inquiries,
    AVG(ci.call_duration) as avg_call_duration,
    COUNT(CASE WHEN ci.priority = 'high' THEN 1 END) as high_priority_count
FROM customer_inquiries ci
GROUP BY ci.tenant_id;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'フロントエンド機能用テーブル作成完了:';
    RAISE NOTICE '- 顧客管理: customers, tags, customer_tags';
    RAISE NOTICE '- ナレッジ: knowledge_articles, customer_inquiries';
    RAISE NOTICE '- AI架電: call_templates, call_campaigns, call_campaign_logs';
    RAISE NOTICE '- 通知: notification_settings, notification_logs';
    RAISE NOTICE '- スタッフ: departments, staff';
    RAISE NOTICE '- 番号管理: phone_numbers';
    RAISE NOTICE '';
    RAISE NOTICE '統計ビュー作成完了';
END $$;

