export interface Profile {
  userId: string;
  fullName: string;
  email?: string;
  dateOfBirth?: string; // YYYY-MM-DD for age calculation (18+)
  age?: number;
  phone?: string;
  title?: string;
  bio?: string;
  location?: string;
  education?: string;
  experienceYears?: string;
  avatarUrl?: string;
  skills: string[];
  targetDomain?: string; // e.g. "ai_ml" | "frontend" | "backend" | "fullstack" | "devops" | "mobile" | "cybersecurity"
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  resumeName?: string;
  resumeText?: string;
  companyName?: string;
  companyWebsite?: string;
}

export interface User {
  id: string;
  email: string;
  role: "job_seeker" | "recruiter";
  profile: Profile;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  description: string;
  salaryRange: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  requiredSkills: string[];
  isActive: boolean;
  created_at: string;
  organizationType: "mnc" | "startup" | "newly_founded";
  jobType: "remote" | "internship" | "full_time";
  experienceLevel: "fresher" | "junior" | "mid" | "senior";
  isFresherFriendly: boolean;
  applicantCount: number;
  competitionLevel: "low" | "medium" | "high";
  matchScore?: number;
  aiRecommendationReason?: string;
  matchingKeywords?: string[];
  missingKeywords?: string[];
}

export interface ATSAnalysisResult {
  atsScore: number;
  isBelow80: boolean;
  isGibberish?: boolean;
  targetDomain?: string;
  domainName?: string;
  missingSkills: string[];
  recommendedDomainSkills: string[];
  matchedKeywords: string[];
  improvementSuggestions: string[];
  summary: string;
  extractedSkills: string[];
  autoFilledData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    title?: string;
    bio?: string;
    location?: string;
    education?: string;
    experienceYears?: string;
    skills?: string[];
    targetDomain?: string;
  };
  topJobMatches: {
    id: string;
    title: string;
    companyName: string;
    matchScore: number;
    matchingKeywords: string[];
    missingKeywords: string[];
  }[];
}

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  keyPoints: string[];
  codeOrMetrics?: {
    label: string;
    value: string;
    trend?: string;
  }[];
  diagramTitle?: string;
  diagramSteps?: string[];
  summaryText: string;
}

export interface SwipeResponse {
  swipe: {
    id: string;
    seekerId: string;
    jobId: string;
    direction: "left" | "right";
    status: string;
    created_at: string;
  };
  matched: boolean;
  matchDetails: {
    jobTitle: string;
    companyName: string;
    contactEmail: string;
  } | null;
}

export interface Match {
  id: string;
  job: Job;
  candidate?: {
    email: string;
    profile: Profile;
  };
  swipedAt: string;
  status: string;
}

export type ApplicationStatus = 
  | "saved_pending" 
  | "swiped_right"
  | "swiped_left"
  | "matched"
  | "applied" 
  | "shortlisted" 
  | "interview_scheduled" 
  | "selected" 
  | "rejected";

export interface ApplicationTimelineStep {
  stage: ApplicationStatus;
  date: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface ApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  salaryRange: string;
  requiredSkills: string[];
  matchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  status: ApplicationStatus;
  savedAt: string;
  appliedAt?: string;
  coverNote?: string;
  recruiterFeedback?: string;
  interviewDate?: string;
  interviewType?: string;
  timeline?: ApplicationTimelineStep[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "mutual_match" | "new_job_alert" | "high_match" | "low_competition" | "application_status";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  created_at: string;
  badge?: string;
}

export interface SeekerAnalyticsData {
  atsScore: number;
  scoreBreakdown: {
    category: string;
    score: number;
    benchmark: number;
    weight: string;
  }[];
  skillGaps: {
    skill: string;
    marketDemand: number;
    potentialScoreBoost: number;
    isPossessed: boolean;
  }[];
  categoryMatchDistribution: {
    name: string;
    value: number;
    avgMatch: number;
  }[];
  marketReadinessTier: "Entry Ready" | "Competitive" | "Top Tier" | "Elite Talent";
}

export interface RecruiterAnalyticsData {
  totalJobs: number;
  totalApplicants: number;
  totalMatches: number;
  funnelMetrics: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  skillDemandDistribution: {
    skill: string;
    jobCount: number;
    avgMatchScore: number;
  }[];
  matchScoreDistribution: {
    range: string;
    candidates: number;
  }[];
  hiringTrendTimeline: {
    month: string;
    applications: number;
    interviews: number;
    hires: number;
  }[];
}

export interface AdminAnalytics {
  userStats: {
    total: number;
    seekers: number;
    recruiters: number;
    admins: number;
  };
  swipeStats: {
    total: number;
    right: number;
    left: number;
    matches: number;
    successRate: number;
  };
  jobsStats: {
    totalPosted: number;
    active: number;
  };
}

