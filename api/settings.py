"""設定管理API - .env優先、なければDBから読み込み"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_tenant
from database import Database
import os

router = APIRouter(prefix="/api/settings", tags=["settings"])
db = Database()

class AsteriskSettings(BaseModel):
    ari_host: Optional[str] = None
    ari_port: Optional[str] = None
    ari_username: Optional[str] = None
    ari_password: Optional[str] = None
    ari_app_name: Optional[str] = None

class AzureSpeechSettings(BaseModel):
    subscription_key: Optional[str] = None
    region: Optional[str] = None
    language: Optional[str] = None
    voice: Optional[str] = None

class DifySettings(BaseModel):
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    knowledge_api_key: Optional[str] = None
    knowledge_endpoint: Optional[str] = None

class ResponseSettings(BaseModel):
    incoming_call_message: Optional[str] = None
    incoming_call_audio_url: Optional[str] = None
    use_audio_incoming: Optional[bool] = None
    human_callout_message: Optional[str] = None
    human_handover_message: Optional[str] = None
    voice_name: Optional[str] = None
    speech_rate: Optional[float] = None
    volume: Optional[int] = None

class AllSettings(BaseModel):
    asterisk: Optional[AsteriskSettings] = None
    azure_speech: Optional[AzureSpeechSettings] = None
    dify: Optional[DifySettings] = None
    response: Optional[ResponseSettings] = None

@router.get("")
async def get_all_settings(tenant = Depends(get_current_tenant)):
    """全設定を取得（.env優先、なければDB）"""
    try:
        # DBから設定を取得
        db_settings = await db.get_tenant_settings(tenant.id)
        
        # .envとマージ（.env優先）
        asterisk_settings = {
            "ari_host": os.getenv("ASTERISK_HOST") or (db_settings.get("ari_host") if db_settings else None),
            "ari_port": os.getenv("ASTERISK_ARI_PORT") or (db_settings.get("ari_port") if db_settings else "8088"),
            "ari_username": os.getenv("ASTERISK_ARI_USERNAME") or (db_settings.get("ari_username") if db_settings else None),
            "ari_password": os.getenv("ASTERISK_ARI_PASSWORD") or (db_settings.get("ari_password") if db_settings else None),
            "ari_app_name": os.getenv("ASTERISK_APP_NAME") or (db_settings.get("ari_app_name") if db_settings else "denco_voiceai"),
        }
        
        azure_settings = {
            "subscription_key": os.getenv("AZURE_SPEECH_KEY") or (db_settings.get("azure_speech_key") if db_settings else None),
            "region": os.getenv("AZURE_SPEECH_REGION") or (db_settings.get("azure_speech_region") if db_settings else "japaneast"),
            "language": db_settings.get("azure_speech_language") if db_settings else "ja-JP",
            "voice": db_settings.get("azure_speech_voice") if db_settings else "ja-JP-NanamiNeural",
        }
        
        dify_settings = {
            "api_key": os.getenv("DIFY_API_KEY") or (db_settings.get("dify_api_key") if db_settings else None),
            "endpoint": os.getenv("DIFY_ENDPOINT") or (db_settings.get("dify_endpoint") if db_settings else "https://api.dify.ai/v1"),
            "knowledge_api_key": db_settings.get("dify_knowledge_api_key") if db_settings else None,
            "knowledge_endpoint": db_settings.get("dify_knowledge_endpoint") if db_settings else None,
        }
        
        response_settings = {
            "incoming_call_message": db_settings.get("greeting_message") if db_settings else "お電話ありがとうございます。",
            "incoming_call_audio_url": db_settings.get("greeting_audio_url") if db_settings else None,
            "use_audio_incoming": db_settings.get("use_audio_greeting") if db_settings else False,
            "human_callout_message": db_settings.get("human_callout_message") if db_settings else "担当者におつなぎしております。",
            "human_handover_message": db_settings.get("human_handover_message") if db_settings else "担当者に代わります。",
            "voice_name": db_settings.get("voice_name") if db_settings else "ja-JP-NanamiNeural",
            "speech_rate": db_settings.get("speech_rate") if db_settings else 1.0,
            "volume": db_settings.get("volume") if db_settings else 75,
        }
        
        return {
            "status": "success",
            "settings": {
                "asterisk": asterisk_settings,
                "azure_speech": azure_settings,
                "dify": dify_settings,
                "response": response_settings,
            },
            "source": {
                "asterisk": "env" if os.getenv("ASTERISK_HOST") else "database",
                "azure_speech": "env" if os.getenv("AZURE_SPEECH_KEY") else "database",
                "dify": "env" if os.getenv("DIFY_API_KEY") else "database",
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
async def update_settings(
    settings: AllSettings,
    tenant = Depends(get_current_tenant)
):
    """設定を更新（DBに保存）"""
    try:
        # 既存設定を取得
        existing = await db.get_tenant_settings(tenant.id)
        
        # 更新データを準備
        update_data = {}
        
        if settings.asterisk:
            if settings.asterisk.ari_host:
                update_data['ari_host'] = settings.asterisk.ari_host
            if settings.asterisk.ari_port:
                update_data['ari_port'] = settings.asterisk.ari_port
            if settings.asterisk.ari_username:
                update_data['ari_username'] = settings.asterisk.ari_username
            if settings.asterisk.ari_password:
                update_data['ari_password'] = settings.asterisk.ari_password
            if settings.asterisk.ari_app_name:
                update_data['ari_app_name'] = settings.asterisk.ari_app_name
        
        if settings.azure_speech:
            if settings.azure_speech.subscription_key:
                update_data['azure_speech_key'] = settings.azure_speech.subscription_key
            if settings.azure_speech.region:
                update_data['azure_speech_region'] = settings.azure_speech.region
            if settings.azure_speech.language:
                update_data['azure_speech_language'] = settings.azure_speech.language
            if settings.azure_speech.voice:
                update_data['azure_speech_voice'] = settings.azure_speech.voice
        
        if settings.dify:
            if settings.dify.api_key:
                update_data['dify_api_key'] = settings.dify.api_key
            if settings.dify.endpoint:
                update_data['dify_endpoint'] = settings.dify.endpoint
            if settings.dify.knowledge_api_key:
                update_data['dify_knowledge_api_key'] = settings.dify.knowledge_api_key
            if settings.dify.knowledge_endpoint:
                update_data['dify_knowledge_endpoint'] = settings.dify.knowledge_endpoint
        
        if settings.response:
            if settings.response.incoming_call_message:
                update_data['greeting_message'] = settings.response.incoming_call_message
            if settings.response.incoming_call_audio_url:
                update_data['greeting_audio_url'] = settings.response.incoming_call_audio_url
            if settings.response.use_audio_incoming is not None:
                update_data['use_audio_greeting'] = settings.response.use_audio_incoming
            if settings.response.human_callout_message:
                update_data['human_callout_message'] = settings.response.human_callout_message
            if settings.response.human_handover_message:
                update_data['human_handover_message'] = settings.response.human_handover_message
            if settings.response.voice_name:
                update_data['voice_name'] = settings.response.voice_name
            if settings.response.speech_rate:
                update_data['speech_rate'] = settings.response.speech_rate
            if settings.response.volume:
                update_data['volume'] = settings.response.volume
        
        # 設定を更新または作成
        if existing:
            await db.update_tenant_settings(tenant.id, update_data)
        else:
            await db.create_tenant_settings(tenant.id, update_data)
        
        return {
            "status": "success",
            "message": "Settings updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

