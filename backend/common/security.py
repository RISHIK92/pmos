from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.firebase import auth

security_scheme = HTTPBearer()

def verify_token(request: Request, creds: HTTPAuthorizationCredentials = Depends(security_scheme)):
    # DEV: Allow bypassing auth with a specific header for testing
    test_uid = request.headers.get("x-test-uid")
    if test_uid:
        return {"uid": test_uid, "email": "test@example.com"}

    token = creds.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Token")