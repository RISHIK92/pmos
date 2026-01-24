import firebase_admin
from firebase_admin import credentials, messaging
import os

# Initialize the App
if not firebase_admin._apps:
    cred_path = "path/to/pmos-fb3ee-firebase-adminsdk-fbsvc-3e2c701e73.json"
    
    if not os.path.exists(cred_path):
        print(f"Warning: Firebase credentials not found at {cred_path}")
    else:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

def send_push_notification(token: str, title: str, body: str, data: dict = None):
    """
    Sends a push notification to a single device.
    """
    if not token:
        print("⚠️ No token provided. Skipping notification.")
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )

        response = messaging.send(message)
        print(f"✅ Notification sent! ID: {response}")
        return True

    except firebase_admin.exceptions.FirebaseError as e:
        print(f"🔥 FCM Error: {e}")
        # Common Error: "registration-token-not-registered"
        # This means the user uninstalled the app. You should delete the token from your DB here.
        return False
