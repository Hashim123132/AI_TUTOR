export type TaskType = "read" | "watch" | "practice" | "quiz" | "review";

export type TaskStatus = "completed" | "in_progress" | "pending";

export interface StudentProfile {
  name: string;
  goal: string;
  examCountdownLabel: string;
}

export interface SubjectMastery {
  subject: string;
  masteryPercent: number;
}

export interface ProgressSummary {
  topicsMastered: number;
  topicsTotal: number;
  studyMinutesThisWeek: number;
  weeklyGoalMinutes: number;
  averageQuizScorePercent: number;
  quizScoreTrendPercent: number;
  streakDays: number;
  subjects: SubjectMastery[];
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: TaskType;
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledLabel: string;
}

export interface DayPlan {
  day: string;
  isToday: boolean;
  taskCount: number;
  totalMinutes: number;
  subjects: string[];
}

export interface QuizResult {
  id: string;
  title: string;
  subject: string;
  scorePercent: number;
  completedLabel: string;
}

export interface DashboardData {
  student: StudentProfile;
  summary: ProgressSummary;
  todayTasks: StudyTask[];
  upcomingTasks: StudyTask[];
  week: DayPlan[];
  recentQuizzes: QuizResult[];
}
