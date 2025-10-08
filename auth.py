from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from database import Database

security = HTTPBearer()
db = Database()

async def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    リクエストヘッダーからテナントを認証
    Bearer tokenとしてテナントIDを使用
    """
    try:
        tenant_id = credentials.credentials
        tenant = await db.get_tenant(tenant_id)
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid tenant credentials"
            )
            
        return tenant
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )