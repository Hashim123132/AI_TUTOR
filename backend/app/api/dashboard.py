import logging
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException

from app.auth import require_user
from app.config import get_settings
from app.schemas.dashboard import DashboardData
from app.services.dashboard import build_dashboard
from app.services.profiles import ProfileNotFound, ProfileStoreError, load_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["dashboard"])

SAMPLE_DASHBOARD = DashboardData.model_validate(
    {
        "student": {
            "name": "Amara",
            "goal": "Ace the machine learning exam and finish the calculus problem sets",
            "examCountdownLabel": "Finals in 6 weeks",
        },
        "summary": {
            "topicsMastered": 12,
            "topicsTotal": 32,
            "studyMinutesThisWeek": 340,
            "weeklyGoalMinutes": 600,
            "averageQuizScorePercent": 78,
            "quizScoreTrendPercent": 6,
            "streakDays": 5,
            "subjects": [
                {"subject": "Machine Learning", "masteryPercent": 62},
                {"subject": "Calculus II", "masteryPercent": 41},
                {"subject": "Data Structures", "masteryPercent": 74},
            ],
        },
        "todayTasks": [
            {
                "id": "task-1",
                "title": "Review gradient descent notes",
                "subject": "Machine Learning",
                "topic": "Optimization",
                "type": "review",
                "status": "completed",
                "estimatedMinutes": 25,
                "scheduledLabel": "9:00 AM",
            },
            {
                "id": "task-2",
                "title": "Watch: Eigenvectors explained",
                "subject": "Calculus II",
                "topic": "Linear algebra foundations",
                "type": "watch",
                "status": "in_progress",
                "estimatedMinutes": 15,
                "scheduledLabel": "2:00 PM",
            },
            {
                "id": "task-3",
                "title": "Quiz: Binary search trees",
                "subject": "Data Structures",
                "topic": "Trees",
                "type": "quiz",
                "status": "pending",
                "estimatedMinutes": 20,
                "scheduledLabel": "5:30 PM",
            },
            {
                "id": "task-4",
                "title": "Practice: Chain rule problems",
                "subject": "Calculus II",
                "topic": "Differentiation",
                "type": "practice",
                "status": "pending",
                "estimatedMinutes": 35,
                "scheduledLabel": "7:00 PM",
            },
        ],
        "upcomingTasks": [
            {
                "id": "task-5",
                "title": "Read: Overfitting and regularization",
                "subject": "Machine Learning",
                "topic": "Model evaluation",
                "type": "read",
                "status": "pending",
                "estimatedMinutes": 30,
                "scheduledLabel": "Tomorrow, 10:00 AM",
            },
            {
                "id": "task-6",
                "title": "Quiz: Integration by parts",
                "subject": "Calculus II",
                "topic": "Integration techniques",
                "type": "quiz",
                "status": "pending",
                "estimatedMinutes": 20,
                "scheduledLabel": "Tomorrow, 4:00 PM",
            },
        ],
        "week": [
            {
                "day": "Mon",
                "isToday": False,
                "taskCount": 3,
                "totalMinutes": 75,
                "subjects": ["Machine Learning", "Calculus II"],
            },
            {
                "day": "Tue",
                "isToday": False,
                "taskCount": 2,
                "totalMinutes": 50,
                "subjects": ["Data Structures"],
            },
            {
                "day": "Wed",
                "isToday": True,
                "taskCount": 4,
                "totalMinutes": 95,
                "subjects": ["Machine Learning", "Calculus II", "Data Structures"],
            },
            {
                "day": "Thu",
                "isToday": False,
                "taskCount": 3,
                "totalMinutes": 80,
                "subjects": ["Machine Learning", "Calculus II"],
            },
            {
                "day": "Fri",
                "isToday": False,
                "taskCount": 2,
                "totalMinutes": 45,
                "subjects": ["Data Structures"],
            },
            {
                "day": "Sat",
                "isToday": False,
                "taskCount": 2,
                "totalMinutes": 60,
                "subjects": ["Machine Learning"],
            },
            {
                "day": "Sun",
                "isToday": False,
                "taskCount": 0,
                "totalMinutes": 0,
                "subjects": [],
            },
        ],
        "recentQuizzes": [
            {
                "id": "quiz-1",
                "title": "Binary search trees",
                "subject": "Data Structures",
                "scorePercent": 85,
                "completedLabel": "Yesterday",
            },
            {
                "id": "quiz-2",
                "title": "Differentiation rules",
                "subject": "Calculus II",
                "scorePercent": 64,
                "completedLabel": "2 days ago",
            },
            {
                "id": "quiz-3",
                "title": "Supervised learning basics",
                "subject": "Machine Learning",
                "scorePercent": 92,
                "completedLabel": "4 days ago",
            },
        ],
    }
)


@router.get("/dashboard", response_model=DashboardData)
def get_dashboard(
    authorization: Annotated[str | None, Header()] = None,
) -> DashboardData:
    """Return the dashboard payload for the signed-in student.

    Requires a Supabase access token in the Authorization header. Returns 404
    when onboarding has not been completed, and 503 when server auth is not
    configured. DASHBOARD_DEMO_MODE=true serves sample data without auth and
    must never be enabled in production.
    """
    settings = get_settings()

    if settings.dashboard_demo_mode:
        logger.warning(
            "DASHBOARD_DEMO_MODE is enabled: serving sample dashboard data "
            "without authentication."
        )
        return SAMPLE_DASHBOARD

    user = require_user(authorization)

    try:
        profile, subjects = load_profile(user.id)
    except ProfileNotFound as exc:
        raise HTTPException(status_code=404, detail="onboarding_required")
    except ProfileStoreError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Profile store unavailable: {exc}",
        )

    return build_dashboard(profile, subjects)
