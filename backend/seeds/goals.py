import asyncio
import sys
from pathlib import Path

# Adjust path to find prisma/services
sys.path.insert(0, str(Path(__file__).parent.parent))

from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()

    SYSTEM_GOALS = [
        {"title": "Daily Steps", "target": 10000, "unit": "steps", "icon": "footsteps", "category": "health"},
        {"title": "Hydration", "target": 2000, "unit": "ml", "icon": "water", "category": "health"},
        {"title": "Sleep", "target": 480, "unit": "mins", "icon": "moon", "category": "health"},
        {"title": "Calories", "target": 2000, "unit": "kcal", "icon": "flame", "category": "health"},
    ]

    try:
        users = await db.user.find_many()
        print(f"Checking goals for {len(users)} users...")

        for user in users:
            for g in SYSTEM_GOALS:
                exists = await db.goal.find_unique(
                    where={
                        'userId_title': {
                            'userId': user.id,
                            'title': g['title']
                        }
                    }
                )

                if not exists:
                    await db.goal.create(
                        data={
                            **g,
                            'userId': user.id,
                            'isSystem': True
                        }
                    )
                    print(f"Created '{g['title']}' for user {user.email}")
                else:
                    print(f"'{g['title']}' already exists for {user.email}")

    except Exception as e:
        print(f"Error seeding goals: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
