from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.firebase import auth

security_scheme = HTTPBearer()

def verify_token(creds: HTTPAuthorizationCredentials = Depends(security_scheme)):
    token = creds.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Token")