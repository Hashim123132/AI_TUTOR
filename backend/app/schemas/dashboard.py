"""Pydantic models for the dashboard API.

Field names are camelCase so JSON payloads match the frontend TypeScript
types in frontend/src/lib/types.ts exactly.
"""

from typing import Literal

from pydantic import BaseModel

TaskType = Literal["read", "watch", "practice", "quiz", "review"]
TaskStatus = Literal["completed", "in_progress", "pending"]


class StudentProfile(BaseModel):
    name: str
    goal: str
    examCountdownLabel: str


class SubjectMastery(BaseModel):
    subject: str
    masteryPercent: int


class ProgressSummary(BaseModel):
    topicsMastered: int
    topicsTotal: int
    studyMinutesThisWeek: int
    weeklyGoalMinutes: int
    averageQuizScorePercent: int
    quizScoreTrendPercent: int
    streakDays: int
    subjects: list[SubjectMastery]


class StudyTask(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    type: TaskType
    status: TaskStatus
    estimatedMinutes: int
    scheduledLabel: str


class DayPlan(BaseModel):
    day: str
    isToday: bool
    taskCount: int
    totalMinutes: int
    subjects: list[str]


class QuizResult(BaseModel):
    id: str
    title: str
    subject: str
    scorePercent: int
    completedLabel: str


class DashboardData(BaseModel):
    student: StudentProfile
    summary: ProgressSummary
    todayTasks: list[StudyTask]
    upcomingTasks: list[StudyTask]
    week: list[DayPlan]
    recentQuizzes: list[QuizResult]
