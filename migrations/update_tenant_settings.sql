-- tenant_settingsテーブルに設定カラムを追加
-- .env優先、なければこちらの値を使用

-- Asterisk ARI設定
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS ari_host VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS ari_port VARCHAR(10) DEFAULT '8088';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS ari_username VARCHAR(100);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS ari_password VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS ari_app_name VARCHAR(100) DEFAULT 'denco_voiceai';

-- Azure Speech設定
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS azure_speech_key VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS azure_speech_region VARCHAR(50) DEFAULT 'japaneast';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS azure_speech_language VARCHAR(10) DEFAULT 'ja-JP';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS azure_speech_voice VARCHAR(100) DEFAULT 'ja-JP-NanamiNeural';

-- Dify設定
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS dify_api_key VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS dify_endpoint VARCHAR(255) DEFAULT 'https://api.dify.ai/v1';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS dify_knowledge_api_key VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS dify_knowledge_endpoint VARCHAR(255);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '設定カラム追加完了:';
    RAISE NOTICE '- Asterisk ARI設定カラム（5個）';
    RAISE NOTICE '- Azure Speech設定カラム（4個）';
    RAISE NOTICE '- Dify設定カラム（4個）';
    RAISE NOTICE '';
    RAISE NOTICE '優先順位: .env > database > default';
END $$;

