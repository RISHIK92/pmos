from app.auth.schema import RegisterResponse
from core.lifespan import db

class AuthService:
    async def register(self, uid: str, email: str, fcm_token: str = None):
        existingUser = await db.user.find_unique(
            where={
                "id": uid,
            }
        )

        if existingUser:
            if fcm_token:
                await db.user.update(
                    where={"id": uid},
                    data={"fcmToken": fcm_token}
                )
            return RegisterResponse(message="Login Successful", status=200, githubUsername=existingUser.githubUsername)

        if not existingUser:
            user_data = {
                "id": uid,
                "email": email,
            }
            if fcm_token:
                user_data["fcmToken"] = fcm_token
                
            await db.user.create(
                data=user_data
            )
        return RegisterResponse(message="Login Successful", status=200, githubUsername=None)