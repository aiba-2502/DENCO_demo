-- DENCO音声AIシステム - 追加テーブル作成スクリプト
-- Node.jsバックエンド統合用のテーブル追加

-- DTMFイベントテーブル
CREATE TABLE IF NOT EXISTS dtmf_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    digit VARCHAR(1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dtmf_events_call_id ON dtmf_events(call_id);
CREATE INDEX IF NOT EXISTS idx_dtmf_events_created_at ON dtmf_events(created_at);

-- テナント設定テーブル（挨拶メッセージなど）
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    greeting_message TEXT DEFAULT 'お電話ありがとうございます。AIアシスタントが対応いたします。',
    greeting_audio_url TEXT,
    use_audio_greeting BOOLEAN DEFAULT FALSE,
    
    -- 応答設定
    human_callout_message TEXT DEFAULT '担当者におつなぎしております。少々お待ちください。',
    human_callout_audio_url TEXT,
    use_audio_human_callout BOOLEAN DEFAULT FALSE,
    
    human_handover_message TEXT DEFAULT '担当者に代わります。引き続きよろしくお願いいたします。',
    human_handover_audio_url TEXT,
    use_audio_human_handover BOOLEAN DEFAULT FALSE,
    
    -- 音声設定
    voice_name VARCHAR(100) DEFAULT 'ja-JP-NanamiNeural',
    speech_rate FLOAT DEFAULT 1.0,
    volume INTEGER DEFAULT 75,
    
    -- その他設定
    call_timeout_seconds INTEGER DEFAULT 300,
    max_silence_seconds INTEGER DEFAULT 10,
    enable_recording BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

-- call_sessionsテーブルにstatusカラムがない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'call_sessions' AND column_name = 'status'
    ) THEN
        ALTER TABLE call_sessions 
        ADD COLUMN status VARCHAR(50) DEFAULT 'ringing';
    END IF;
END $$;

-- messagesテーブルにtypeカラムがない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'type'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN type VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- call_sessionsテーブルのインデックス追加
CREATE INDEX IF NOT EXISTS idx_call_sessions_tenant_id ON call_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_start_time ON call_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);

-- messagesテーブルのインデックス追加
CREATE INDEX IF NOT EXISTS idx_messages_call_id ON messages(call_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 通話統計用のビュー作成
CREATE OR REPLACE VIEW call_statistics_view AS
SELECT 
    tenant_id,
    DATE(start_time) as call_date,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
    COUNT(CASE WHEN status IN ('ringing', 'answered', 'in_progress') THEN 1 END) as active_calls,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds,
    MAX(EXTRACT(EPOCH FROM (end_time - start_time))) as max_duration_seconds,
    MIN(EXTRACT(EPOCH FROM (end_time - start_time))) as min_duration_seconds
FROM call_sessions
WHERE start_time IS NOT NULL
GROUP BY tenant_id, DATE(start_time);

-- デフォルトのテナント設定を挿入
INSERT INTO tenant_settings (tenant_id, greeting_message)
SELECT id, 'お電話ありがとうございます。AIアシスタントが対応いたします。'
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings)
ON CONFLICT (tenant_id) DO NOTHING;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'テーブル追加完了:';
    RAISE NOTICE '- dtmf_events: DTMFイベント記録';
    RAISE NOTICE '- tenant_settings: テナント設定（挨拶メッセージ等）';
    RAISE NOTICE '- call_statistics_view: 通話統計ビュー';
    RAISE NOTICE '';
    RAISE NOTICE 'インデックス追加完了';
    RAISE NOTICE 'デフォルト設定挿入完了';
END $$;

