import httpx
import asyncio
from datetime import datetime
from core.lifespan import db
from app.dev.schema import DevProfile, Repo, DeepWorkMetrics, InboxItem, LanguageStat
from collections import Counter

class DevService:
    async def get_profile(self, uid: str, timezone_offset: int) -> DevProfile:
        # 1. Get User's GitHub Token
        user = await db.user.find_unique(where={"id": uid})
        if not user or not user.githubToken:
            raise Exception("GitHub not connected")
        
        token = user.githubToken
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"}
        
        async with httpx.AsyncClient() as client:
            # 2. Fetch User Profile
            profile_resp = await client.get("https://api.github.com/user", headers=headers)
            profile_data = profile_resp.json()
            
            # 3. Fetch Repos (Top 15 sorted by updated)
            repos_resp = await client.get("https://api.github.com/user/repos?sort=updated&per_page=15", headers=headers)
            repos_data = repos_resp.json()
            
            repos = []
            languages = []
            stars = 0
            
            for r in repos_data:
                repo = Repo(
                    name=r["name"],
                    description=r["description"],
                    language=r["language"],
                    stars=r["stargazers_count"],
                    forks=r["forks_count"],
                    url=r["html_url"],
                    updated_at=r["updated_at"]
                )
                repos.append(repo)
                stars += repo.stars
                if repo.language:
                    languages.append(repo.language)
            
            # Simple top languages calc
            top_langs_list = [l for l, c in Counter(languages).most_common(5)]

            # PARALLEL FETCHING FOR ADVANCED METRICS
            username = profile_data["login"]
            
            deep_work, inbox, skill_stack = await asyncio.gather(
                self._fetch_deep_work(client, username, headers, timezone_offset),
                self._fetch_inbox(client, username, headers),
                self._fetch_skill_stack(client, repos_data[:5], headers) # Use top 5 active repos
            )
            
            return DevProfile(
                username=username,
                avatar_url=profile_data["avatar_url"],
                bio=profile_data.get("bio"),
                public_repos=profile_data["public_repos"],
                followers=profile_data["followers"],
                following=profile_data["following"],
                top_repos=repos[:6],
                top_languages=top_langs_list,
                total_stars=stars,
                total_commits_year=0,
                deep_work=deep_work,
                inbox=inbox,
                skill_stack=skill_stack
            )

    async def _fetch_deep_work(self, client: httpx.AsyncClient, username: str, headers: dict, offset_minutes: int) -> DeepWorkMetrics:
        # Fetch last 30 events (default page size) - sufficient for "recent activity" snapshot
        try:
            resp = await client.get(f"https://api.github.com/users/{username}/events", headers=headers)
            events = resp.json()
            
            push_events = [e for e in events if e["type"] == "PushEvent"]
            
            if not push_events:
                 return DeepWorkMetrics(
                    focus_hours_percentage=0,
                    context_switching_score="Low",
                    night_owl_percentage=0,
                    active_days_streak=0
                )

            total_commits = len(push_events)
            focus_commits = 0
            night_commits = 0
            unique_repos = set()
            
            for e in push_events:
                created_at_utc = datetime.fromisoformat(e["created_at"].replace("Z", "+00:00"))
                # Apply timezone offset (minutes)
                # offset is typically passed as minutes from client (e.g. -330 for IST +5:30)
                # Wait, client usually sends timezone offset as "minutes to subtract from UTC to get local" 
                # e.g. IST is UTC+5:30, so offset is -330. So UTC - (-330) = Local.
                # However, common pattern: get 'minutes offset' from JS Date.getTimezoneOffset().
                # JS: IST is UTC+5:30. getTimezoneOffset() returns -330.
                # Logic: Local = UTC - offset.
                
                # Update: User requested "pass the local time format from get params".
                # Let's assume passed param is `timezone_offset` in minutes (like JS getTimezoneOffset).
                
                from datetime import timedelta
                created_at_local = created_at_utc - timedelta(minutes=offset_minutes)
                
                hour = created_at_local.hour
                
                # Focus: 10 AM - 2 PM (10 - 14)
                if 10 <= hour < 14:
                    focus_commits += 1
                
                # Night Owl: After 10 PM (22) or before 4 AM (4)
                if hour >= 22 or hour < 4:
                    night_commits += 1
                    
                unique_repos.add(e["repo"]["name"])
            
            focus_pct = int((focus_commits / total_commits) * 100) if total_commits else 0
            night_pct = int((night_commits / total_commits) * 100) if total_commits else 0
            
            repo_count = len(unique_repos)
            context_score = "Low"
            if repo_count >= 4:
                context_score = "High"
            elif repo_count >= 2:
                context_score = "Medium"
                
            return DeepWorkMetrics(
                focus_hours_percentage=focus_pct,
                context_switching_score=context_score,
                night_owl_percentage=night_pct,
                active_days_streak=0 # Placeholder or requires heavier calculation
            )
        except Exception as e:
            print(f"Error fetching deep work: {e}")
            return DeepWorkMetrics(focus_hours_percentage=0, context_switching_score="Low", night_owl_percentage=0, active_days_streak=0)

    async def _fetch_inbox(self, client: httpx.AsyncClient, username: str, headers: dict) -> list[InboxItem]:
        # 1. PRs assigned to user (Review Requested)
        # 2. PRs created by user with Changes Requested (Blocked)
        # 3. Issues mentioning user
        
        inbox_items = []
        try:
            # Query 1: PRs assigned to me
            q1 = f"is:pr is:open review-requested:{username}"
            resp1 = await client.get(f"https://api.github.com/search/issues?q={q1}", headers=headers)
            items1 = resp1.json().get("items", [])
            for i in items1:
                inbox_items.append(InboxItem(
                    id=i["id"],
                    title=i["title"],
                    url=i["html_url"],
                    type="PR_REVIEW",
                    status="Action Required",
                    repo_name=self._extract_repo_name(i["repository_url"]),
                    created_at=i["created_at"],
                    author=i["user"]["login"]
                ))
                
            # Query 2: Blocked PRs (My PRs with changes requested)
            q2 = f"is:pr is:open author:{username} review:changes_requested"
            resp2 = await client.get(f"https://api.github.com/search/issues?q={q2}", headers=headers)
            items2 = resp2.json().get("items", [])
            for i in items2:
                inbox_items.append(InboxItem(
                    id=i["id"],
                    title=i["title"],
                    url=i["html_url"],
                    type="PR_BLOCKED",
                    status="Changes Requested",
                    repo_name=self._extract_repo_name(i["repository_url"]),
                    created_at=i["created_at"],
                    author=username
                ))
            
            # Query 3: Mentions
            q3 = f"is:issue is:open mentions:{username}"
            resp3 = await client.get(f"https://api.github.com/search/issues?q={q3}", headers=headers)
            items3 = resp3.json().get("items", [])
            for i in items3:
                 inbox_items.append(InboxItem(
                    id=i["id"],
                    title=i["title"],
                    url=i["html_url"],
                    type="MENTION",
                    status="Mentioned",
                    repo_name=self._extract_repo_name(i["repository_url"]),
                    created_at=i["created_at"],
                    author=i["user"]["login"]
                 ))

        except Exception as e:
            print(f"Error fetching inbox: {e}")
            
        return inbox_items

    async def _fetch_skill_stack(self, client: httpx.AsyncClient, repos: list, headers: dict) -> list[LanguageStat]:
        # Aggregate languages from top 5 repos
        lang_totals = Counter()
        
        try:
            tasks = []
            for repo in repos:
                 tasks.append(client.get(repo["languages_url"], headers=headers))
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for response in responses:
                if isinstance(response, httpx.Response) and response.status_code == 200:
                    lang_totals.update(response.json())
        
        except Exception as e:
            print(f"Error fetching skills: {e}")
            return []
            
        total_bytes = sum(lang_totals.values())
        if total_bytes == 0:
            return []
            
        stats = []
        # Predefined colors for common languages
        colors = {
            "Python": "#3572A5", "TypeScript": "#2b7489", "JavaScript": "#f1e05a",
            "Go": "#00ADD8", "Java": "#b07219", "HTML": "#e34c26", "CSS": "#563d7c",
            "Rust": "#dea584", "C++": "#f34b7d", "C": "#555555"
        }
        
        for lang, byte_count in lang_totals.most_common(6): # Top 6
            pct = (byte_count / total_bytes) * 100
            stats.append(LanguageStat(
                name=lang,
                percentage=round(pct, 1),
                color=colors.get(lang, "#CCCCCC")
            ))
            
        return stats

    def _extract_repo_name(self, url: str) -> str:
        # url: https://api.github.com/repos/owner/repo
        parts = url.split("/")
        return f"{parts[-2]}/{parts[-1]}" if len(parts) >= 2 else "unknown"
