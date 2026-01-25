import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from core.lifespan import db

router = APIRouter()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

from fastapi import APIRouter, HTTPException, Query

@router.get("/auth/github/login")
async def github_login(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email required to link account")
    
    if not GITHUB_CLIENT_ID:
         raise HTTPException(status_code=500, detail="Server misconfigured: GITHUB_CLIENT_ID missing")
    
    # Pass email in 'state' so we know who to link in the callback
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=repo read:user&state={email}"
    )

@router.get("/auth/github/callback")
async def github_callback(code: str, state: str = Query(None)): 
    user_email = state # Retrieve the email we passed earlier

    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
         raise HTTPException(status_code=500, detail="Server misconfigured: GitHub secrets missing")

    if not user_email:
        return RedirectResponse(url="pmos://?status=error&reason=no_email")

    async with httpx.AsyncClient() as client:
        # A. Exchange Code for Access Token
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        # B. Get GitHub Username
        user_resp = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})
        gh_username = user_resp.json().get("login")

        # C. Update the Database (Server-Side)
        # We find the user by their email and add the GitHub data
        if access_token and gh_username:
            # Check if user exists first to match Prisma logic (optional but good practice)
            # For now, assumes email exists since it came from valid state pass-through of logged-in user
            await db.user.update(
                where={"email": user_email},
                data={
                    "githubToken": access_token,
                    "githubUsername": gh_username
                }
            )

    return RedirectResponse(url="pmos://config")
