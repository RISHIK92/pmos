from pydantic import BaseModel
from typing import List, Optional

class Repo(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int
    forks: int
    url: str
    updated_at: str

class DeepWorkMetrics(BaseModel):
    focus_hours_percentage: int  # % of commits between 10 AM - 2 PM
    context_switching_score: str  # "Low" (1 repo), "Medium" (2-3), "High" (4+)
    night_owl_percentage: int     # % of commits after 10 PM
    active_days_streak: int       # Bonus: streak

class InboxItem(BaseModel):
    id: int
    title: str
    url: str
    type: str          # "PR_REVIEW", "PR_BLOCKED", "MENTION"
    status: str
    repo_name: str
    created_at: str
    author: str

class LanguageStat(BaseModel):
    name: str
    percentage: float
    color: str

class DevProfile(BaseModel):
    username: str
    avatar_url: str
    bio: Optional[str] = None
    public_repos: int
    followers: int
    following: int
    top_repos: List[Repo]
    top_languages: List[str] # Keeping this for legacy compatibility or simple list
    total_stars: int
    total_commits_year: int
    
    # New Metric Sections
    deep_work: DeepWorkMetrics
    inbox: List[InboxItem]
    skill_stack: List[LanguageStat]
