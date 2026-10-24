"""Assemble the dashboard payload from a stored profile.

Phase 2 has no study sessions, tasks, or quizzes yet, so those collections are
empty and progress counters start at zero. Weekly goal minutes, subjects, and
the deadline badge come from the user's onboarding answers.
"""

from datetime import date

from app.schemas.dashboard import (
    DashboardData,
    DayPlan,
    ProgressSummary,
    QuizResult,
    StudentProfile,
    SubjectMastery,
    StudyTask,
)
from app.services.profiles import ProfileRecord

# Monday-first ordering used by the dashboard week preview.
WEEK_DAY_LABELS: list[tuple[str, str]] = [
    ("monday", "Mon"),
    ("tuesday", "Tue"),
    ("wednesday", "Wed"),
    ("thursday", "Thu"),
    ("friday", "Fri"),
    ("saturday", "Sat"),
    ("sunday", "Sun"),
]

WEEKDAY_NAME_TO_INDEX = {name: index for index, (name, _) in enumerate(WEEK_DAY_LABELS)}


def deadline_label(deadline: date | None, today: date | None = None) -> str:
    if deadline is None:
        return "No deadline set"
    today = today or date.today()
    days = (deadline - today).days
    if days < 0:
        return "Deadline passed"
    if days == 0:
        return "Deadline today"
    if days == 1:
        return "Deadline tomorrow"
    if days < 14:
        return f"Deadline in {days} days"
    if days < 60:
        return f"Deadline in {days // 7} weeks"
    if days < 365:
        return f"Deadline in {days // 30} months"
    years = days // 365
    return f"Deadline in {years} {'year' if years == 1 else 'years'}"


def build_week(profile: ProfileRecord, subjects: list[str], today: date | None = None) -> list[DayPlan]:
    today = today or date.today()
    today_name = WEEK_DAY_LABELS[today.weekday()][0]

    week: list[DayPlan] = []
    for day_name, label in WEEK_DAY_LABELS:
        is_study_day = day_name in profile.study_days
        week.append(
            DayPlan(
                day=label,
                isToday=day_name == today_name,
                taskCount=0,
                totalMinutes=profile.study_minutes_per_day if is_study_day else 0,
                subjects=list(subjects) if is_study_day else [],
            )
        )
    return week


def build_dashboard(
    profile: ProfileRecord,
    subjects: list[str],
    today: date | None = None,
) -> DashboardData:
    weekly_goal_minutes = profile.study_minutes_per_day * len(profile.study_days)

    summary = ProgressSummary(
        topicsMastered=0,
        topicsTotal=0,
        studyMinutesThisWeek=0,
        weeklyGoalMinutes=weekly_goal_minutes,
        averageQuizScorePercent=0,
        quizScoreTrendPercent=0,
        streakDays=0,
        subjects=[
            SubjectMastery(subject=name, masteryPercent=0) for name in subjects
        ],
    )

    student = StudentProfile(
        name=profile.display_name,
        goal=profile.goal,
        examCountdownLabel=deadline_label(profile.target_deadline, today=today),
    )

    empty_tasks: list[StudyTask] = []
    empty_quizzes: list[QuizResult] = []

    return DashboardData(
        student=student,
        summary=summary,
        todayTasks=empty_tasks,
        upcomingTasks=empty_tasks,
        week=build_week(profile, subjects, today=today),
        recentQuizzes=empty_quizzes,
    )
