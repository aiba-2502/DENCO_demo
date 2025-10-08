import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import asyncio
import json
from datetime import datetime, timedelta
import azure.cognitiveservices.speech as speechsdk
from database import Database
from auth import get_current_tenant
from models import CallSession, Message, FaxDocument
from vad import VoiceActivityDetector
from dify_client import DifyClient
from google.cloud import vision
import PIL.Image
from pdf2image import convert_from_bytes
import io

app = FastAPI(title="Voice AI Call System")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターの統合
from api import customers, tags, knowledge, campaigns, tenants, settings

app.include_router(customers.router)
app.include_router(tags.router)
app.include_router(knowledge.router)
app.include_router(campaigns.router)
app.include_router(tenants.router)
app.include_router(settings.router)

# データベース接続
db = Database()

# VAD検出器
vad = VoiceActivityDetector()

# アクティブな通話セッション
active_sessions: Dict[str, Dict] = {}

# Google Cloud Vision クライアント（遅延初期化）
vision_client = None

def get_vision_client():
    """Google Cloud Vision クライアントを取得（遅延初期化）"""
    global vision_client
    if vision_client is None:
        try:
            vision_client = vision.ImageAnnotatorClient()
        except Exception as e:
            print(f"Warning: Google Cloud Vision not configured: {e}")
            print("FAX OCR機能は無効です。Google Cloud認証情報を設定してください。")
    return vision_client

class CallRequest(BaseModel):
    from_number: str
    to_number: str
    tenant_id: str

class FaxStatusUpdate(BaseModel):
    fax_id: str
    job_id: str
    status: str
    timestamp: datetime
    error_message: Optional[str] = None

class CallSessionCreate(BaseModel):
    call_id: str
    from_number: str
    to_number: str
    tenant_id: Optional[str] = None

class CallSessionEnd(BaseModel):
    end_time: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[str] = "completed"

class DtmfEvent(BaseModel):
    digit: str
    timestamp: Optional[str] = None

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# ==================== ヘルスチェック ====================

@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "python-backend",
        "database": "connected" if db.pool else "disconnected"
    }

# ==================== Node.jsバックエンド連携API ====================

@app.post("/api/calls")
async def create_call_session(
    request: CallSessionCreate,
    tenant = Depends(get_current_tenant)
):
    """
    通話セッションを作成（Node.jsバックエンドから呼ばれる）
    """
    try:
        # テナントIDはトークンから取得、またはリクエストから
        tenant_id = request.tenant_id or tenant.id
        
        # 通話セッションを作成
        session = await db.create_call_session(
            call_id=request.call_id,
            tenant_id=tenant_id,
            from_number=request.from_number,
            to_number=request.to_number,
            status="ringing"
        )
        
        return {
            "status": "success",
            "call_id": request.call_id,
            "tenant_id": tenant_id,
            "session": dict(session)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create call session: {str(e)}"
        )

@app.post("/api/calls/{call_id}/end")
async def end_call_session(
    call_id: str,
    request: CallSessionEnd,
    tenant = Depends(get_current_tenant)
):
    """
    通話終了を記録（Node.jsバックエンドから呼ばれる）
    """
    try:
        # セッションが存在するか確認
        session = await db.get_call_session(call_id)
        if not session:
            raise HTTPException(status_code=404, detail="Call session not found")
        
        # 通話セッションを更新
        end_time = datetime.fromisoformat(request.end_time.replace('Z', '+00:00')) if request.end_time else datetime.utcnow()
        
        await db.update_call_session(
            call_id=call_id,
            status=request.status,
            end_time=end_time
        )
        
        # アクティブセッションから削除
        if call_id in active_sessions:
            del active_sessions[call_id]
        
        return {
            "status": "success",
            "call_id": call_id,
            "end_time": end_time.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to end call session: {str(e)}"
        )

@app.post("/api/calls/{call_id}/dtmf")
async def record_dtmf(
    call_id: str,
    request: DtmfEvent,
    tenant = Depends(get_current_tenant)
):
    """
    DTMF入力を記録（Node.jsバックエンドから呼ばれる）
    """
    try:
        # セッションが存在するか確認
        session = await db.get_call_session(call_id)
        if not session:
            raise HTTPException(status_code=404, detail="Call session not found")
        
        # DTMF入力を保存
        timestamp = datetime.fromisoformat(request.timestamp.replace('Z', '+00:00')) if request.timestamp else None
        await db.save_dtmf(
            call_id=call_id,
            digit=request.digit,
            timestamp=timestamp
        )
        
        return {
            "status": "success",
            "call_id": call_id,
            "digit": request.digit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record DTMF: {str(e)}"
        )

@app.get("/api/tenants/{tenant_id}/greeting")
async def get_tenant_greeting(
    tenant_id: str,
    tenant = Depends(get_current_tenant)
):
    """
    テナントの挨拶メッセージ設定を取得（Node.jsバックエンドから呼ばれる）
    """
    try:
        greeting = await db.get_tenant_greeting(tenant_id)
        
        if not greeting:
            # デフォルトの挨拶メッセージ
            return {
                "status": "success",
                "greeting_message": "お電話ありがとうございます。AIアシスタントが対応いたします。",
                "greeting_uri": None,
                "use_audio": False
            }
        
        return {
            "status": "success",
            "greeting_message": greeting.get("greeting_message"),
            "greeting_uri": greeting.get("greeting_audio_url"),
            "use_audio": greeting.get("use_audio_greeting", False)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get greeting: {str(e)}"
        )

# ==================== フロントエンド用API ====================

@app.get("/api/calls")
async def get_call_history(
    limit: int = 50,
    offset: int = 0,
    tenant = Depends(get_current_tenant)
):
    """
    通話履歴一覧を取得（フロントエンドから呼ばれる）
    """
    try:
        sessions = await db.get_call_sessions(
            tenant_id=tenant.id,
            limit=limit,
            offset=offset
        )
        
        total = await db.get_call_sessions_count(tenant.id)
        
        return {
            "status": "success",
            "calls": sessions,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get call history: {str(e)}"
        )

@app.get("/api/calls/active")
async def get_active_calls(
    tenant = Depends(get_current_tenant)
):
    """
    アクティブな通話一覧を取得（フロントエンドから呼ばれる）
    """
    try:
        calls = await db.get_active_calls(tenant.id)
        
        # アクティブセッション情報も追加
        for call in calls:
            call_id = call.get('id')
            if call_id in active_sessions:
                call['is_connected'] = True
                call['has_ai_session'] = True
            else:
                call['is_connected'] = False
                call['has_ai_session'] = False
        
        return {
            "status": "success",
            "calls": calls,
            "count": len(calls)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active calls: {str(e)}"
        )

@app.get("/api/calls/{call_id}")
async def get_call_detail(
    call_id: str,
    tenant = Depends(get_current_tenant)
):
    """
    通話詳細を取得（フロントエンドから呼ばれる）
    """
    try:
        session = await db.get_call_session(call_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Call session not found")
        
        # メッセージ履歴を取得
        messages = await db.get_messages(call_id)
        
        return {
            "status": "success",
            "session": dict(session),
            "messages": [dict(msg) for msg in messages]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get call detail: {str(e)}"
        )

@app.get("/api/calls/{call_id}/messages")
async def get_call_messages(
    call_id: str,
    tenant = Depends(get_current_tenant)
):
    """
    通話のメッセージ履歴を取得（フロントエンドから呼ばれる）
    """
    try:
        # セッションが存在するか確認
        session = await db.get_call_session(call_id)
        if not session:
            raise HTTPException(status_code=404, detail="Call session not found")
        
        messages = await db.get_messages(call_id)
        
        return {
            "status": "success",
            "call_id": call_id,
            "messages": [dict(msg) for msg in messages]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get messages: {str(e)}"
        )

@app.get("/api/statistics")
async def get_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tenant = Depends(get_current_tenant)
):
    """
    通話統計を取得（フロントエンドから呼ばれる）
    """
    try:
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        stats = await db.get_call_statistics(
            tenant_id=tenant.id,
            start_date=start_dt,
            end_date=end_dt
        )
        
        return {
            "status": "success",
            "statistics": stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )

@app.post("/api/fax/webhook/inbound")
async def fax_webhook_inbound(
    fax_id: str = Form(...),
    sender_number: str = Form(...),
    receiver_number: str = Form(...),
    pages: int = Form(...),
    timestamp: str = Form(...),
    tiff_file: UploadFile = File(...),
    tenant = Depends(get_current_tenant)
):
    try:
        # TIFFファイルを読み込み
        tiff_content = await tiff_file.read()
        
        # ファイル保存パスを生成
        base_path = f"storage/fax/{tenant.id}/{fax_id}"
        os.makedirs(os.path.dirname(base_path), exist_ok=True)
        
        # TIFFファイルを保存
        tiff_path = f"{base_path}.tiff"
        with open(tiff_path, "wb") as f:
            f.write(tiff_content)
            
        # TIFFをPDFに変換
        image = PIL.Image.open(io.BytesIO(tiff_content))
        pdf_path = f"{base_path}.pdf"
        image.save(pdf_path, "PDF")
        
        # OCR処理
        ocr_text = ""
        try:
            client = get_vision_client()
            if client:
                image = vision.Image(content=tiff_content)
                response = client.text_detection(image=image)
                ocr_text = response.text_annotations[0].description if response.text_annotations else ""
        except Exception as e:
            print(f"Warning: OCR processing skipped: {e}")
            ocr_text = "[OCR not available]"
        
        # データベースに保存
        document = await db.save_fax_document(
            tenant_id=tenant.id,
            direction="inbound",
            sender_number=sender_number,
            receiver_number=receiver_number,
            status="completed",
            tiff_path=tiff_path,
            pdf_path=pdf_path,
            ocr_text=ocr_text
        )
        
        return {
            "status": "success",
            "message": "FAX received successfully",
            "document_id": document.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process FAX: {str(e)}"
        )

@app.post("/api/fax/webhook/status")
async def fax_webhook_status(
    status_update: FaxStatusUpdate,
    tenant = Depends(get_current_tenant)
):
    try:
        # ステータス更新
        await db.update_fax_status(
            fax_id=status_update.fax_id,
            status=status_update.status,
            error_message=status_update.error_message
        )
        
        return {
            "status": "success",
            "message": "Status updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update status: {str(e)}"
        )

@app.websocket("/ws/call/{call_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    call_id: str,
    tenant = Depends(get_current_tenant)
):
    await websocket.accept()
    
    try:
        # セッション初期化
        session = await db.get_call_session(call_id)
        if not session:
            raise HTTPException(status_code=404, detail="Call session not found")
        
        active_sessions[call_id] = {
            "websocket": websocket,
            "speech_config": speechsdk.SpeechConfig(
                subscription=tenant.azure_speech_key,
                region=tenant.azure_speech_region
            ),
            "dify_client": DifyClient(
                api_key=tenant.dify_api_key,
                endpoint=tenant.dify_endpoint
            ),
            "buffer": [],
            "is_speaking": False
        }
        
        # 音声ストリーム処理ループ
        while True:
            data = await websocket.receive_bytes()
            
            # VADで発話区間検出
            is_speech = vad.detect(data)
            session = active_sessions[call_id]
            
            if is_speech:
                session["buffer"].append(data)
                if not session["is_speaking"]:
                    session["is_speaking"] = True
                    
            elif session["is_speaking"]:
                # 発話終了を検出
                session["is_speaking"] = False
                
                # 音声認識実行
                audio_buffer = b"".join(session["buffer"])
                text = await recognize_speech(audio_buffer, session["speech_config"])
                
                # Difyで応答生成
                response = await session["dify_client"].get_response(text)
                
                # 音声合成
                audio_response = await synthesize_speech(
                    response,
                    session["speech_config"]
                )
                
                # クライアントに送信
                await websocket.send_bytes(audio_response)
                
                # ログ保存
                await db.save_message(
                    call_id=call_id,
                    content=text,
                    type="user"
                )
                await db.save_message(
                    call_id=call_id,
                    content=response,
                    type="ai"
                )
                
                session["buffer"] = []
                
    except WebSocketDisconnect:
        if call_id in active_sessions:
            del active_sessions[call_id]
    except Exception as e:
        print(f"Error in websocket connection: {e}")
        if call_id in active_sessions:
            del active_sessions[call_id]

async def recognize_speech(audio_data: bytes, speech_config: speechsdk.SpeechConfig) -> str:
    """Azure Speech-to-Textで音声認識を実行"""
    audio_input = speechsdk.AudioInputStream(audio_data)
    speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        audio_config=speechsdk.AudioConfig(stream=audio_input)
    )
    
    result = await speech_recognizer.recognize_once_async()
    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text
    return ""

async def synthesize_speech(text: str, speech_config: speechsdk.SpeechConfig) -> bytes:
    """Azure Text-to-Speechで音声合成を実行"""
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config
    )
    
    result = await speech_synthesizer.speak_text_async(text)
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return result.audio_data
    return b""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)