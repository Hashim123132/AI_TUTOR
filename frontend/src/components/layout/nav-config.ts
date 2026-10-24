import type { LucideIcon } from "lucide-react"
import {
  BookOpenIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MessagesSquareIcon,
  TargetIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    description: "Today's tasks and progress at a glance",
  },
  {
    label: "Study Plan",
    href: "/study-plan",
    icon: CalendarRangeIcon,
    description: "Your personalized weekly schedule",
  },
  {
    label: "My Resources",
    href: "/resources",
    icon: BookOpenIcon,
    description: "Uploaded notes, PDFs, and links",
  },
  {
    label: "AI Tutor",
    href: "/tutor",
    icon: MessagesSquareIcon,
    description: "Ask questions grounded in your material",
  },
  {
    label: "Quizzes",
    href: "/quizzes",
    icon: ClipboardCheckIcon,
    description: "Practice and check your understanding",
  },
  {
    label: "Progress",
    href: "/progress",
    icon: TargetIcon,
    description: "Mastery tracking over time",
  },
]

export const brandIcon = GraduationCapIcon
