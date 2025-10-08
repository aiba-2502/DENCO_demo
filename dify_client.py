import httpx
from typing import Optional

class DifyClient:
    def __init__(self, api_key: str, endpoint: str):
        """
        Dify APIクライアントを初期化
        
        Args:
            api_key: Dify API Key
            endpoint: Dify APIエンドポイント
        """
        self.api_key = api_key
        self.endpoint = endpoint
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
    async def get_response(self, text: str) -> str:
        """
        Difyを使用して応答を生成
        
        Args:
            text: ユーザーの入力テキスト
            
        Returns:
            str: 生成された応答テキスト
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.endpoint}/chat-messages",
                headers=self.headers,
                json={
                    "inputs": {},
                    "query": text,
                    "response_mode": "streaming",
                    "conversation_id": None
                }
            )
            
            if response.status_code == 200:
                # ストリーミングレスポンスを結合
                full_response = ""
                for line in response.iter_lines():
                    if line:
                        data = line.decode('utf-8')
                        if data.startswith('data: '):
                            chunk = data[6:]  # 'data: ' を除去
                            full_response += chunk
                return full_response
            else:
                return "申し訳ありません。応答の生成中にエラーが発生しました。"