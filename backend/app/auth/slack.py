import os
import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from core.lifespan import db

router = APIRouter()

SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")

@router.get("/auth/slack/login")
async def slack_login(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # SCOPES: These determine what PMOS can do in the user's slack
    # 'chat:write' -> Send messages (reminders)
    # 'im:write'   -> Send Direct Messages
    # 'users:read' -> See who the user is
    user_scopes = "channels:read,groups:read,im:read,mpim:read,chat:write"
    
    # We send the user to Slack to pick THEIR workspace
    return RedirectResponse(
        f"https://slack.com/oauth/v2/authorize?client_id={SLACK_CLIENT_ID}&user_scope={user_scopes}&state={email}"
    )

@router.get("/auth/slack/callback")
async def slack_callback(code: str, state: str = Query(None)): 
    user_email = state 

    if not user_email:
        return RedirectResponse(url="pmos://?status=error&reason=no_email")

    async with httpx.AsyncClient() as client:
        # A. Exchange the code for a Token
        response = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": SLACK_CLIENT_ID,
                "client_secret": SLACK_CLIENT_SECRET,
                "code": code,
            }
        )
        data = response.json()

        if not data.get("ok"):
             print(f"Slack Error: {data}")
             return RedirectResponse(url="pmos://?status=error&reason=slack_fail")

        # B. Extract the unique data for THIS user's workspace
        access_token = data["access_token"]  # Token to control the bot in this workspace
        team_name = data["team"]["name"]     # e.g., "Google" or "My Startup"
        user_id = data["authed_user"]["id"]  # The ID of the user who installed it (to DM them later)

        # C. Save to Database
        await db.user.update(
            where={"email": user_email},
            data={
                "slackToken": access_token,
                "slackTeamName": team_name,
                "slackId": user_id 
            }
        )

    # D. Return to App (Closes Browser)
    return RedirectResponse(url="pmos://")
