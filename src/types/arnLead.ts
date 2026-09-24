export enum LeadStatus {
  NEW = "new",
  IN_PROGRESS = "in-progress",
  CONVERTED = "converted",
  LOST = "lost",
}

export enum LeadSource {
  WEBSITE = "website",
  REFERRAL = "referral",
  WALK_IN = "walk-in",
  PHONE = "phone",
  EMAIL = "email",
  SOCIAL_MEDIA = "social-media",
  EVENT = "event",
  OTHER = "other",
}

export interface ArnLead {
  id: number;
  userId?: number;
  userName?: string;
  name: string;
  email: string;
  mobileNumber: string;
  source: string;
  appType: string | null;
  status: LeadStatus;
  potentialInvestment: number | null;
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  priority: number;
  generatedById: number;
  generatedByType: string | null;
  assignedToId: number | null;
  assignedByType: string | null;
  convertedAt: string | null;
  convertedAmount: number | null;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  generatedByName?: string;
  assignedToName?: string;
  managerName?: string;
  netWorth?: number;
  onboardingDate?: string;
}

export interface ArnLeadsBackendResponse {
  leads: ArnLead[];
  employeeNames?: { [key: number]: string };
  arnEuinNames?: { [key: number]: string };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  users?: ArnLead[];
  totalUsers?: number;
}

export interface CreateLeadPayload {
  name: string;
  email?: string;
  mobileNumber: string;
  source?: string;
  appType?: string;
  potentialInvestment?: number;
  notes?: string;
  nextFollowUpAt?: string;
  imageUrl?: string;
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
  status?: LeadStatus;
  lastContactedAt?: string;
  convertedAt?: string;
  convertedAmount?: number;
}

export interface AssignLeadPayload {
  assignedToId: number;
}

export interface PartnerLeadStats {
  total: number;
  new: number;
  "in-progress": number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export interface PartnerLeadStatsResponse {
  success: boolean;
  message: string;
  data: PartnerLeadStats;
}

export interface FetchLeadsParams {
  page: number;
  search?: string;
  source?: string;
  status?: LeadStatus;
  assignedToId?: number;
  generatedById?: number;
  priority?: number;
  fromDate?: string;
  toDate?: string;
  type?: "individual" | "team";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  followUpTimeframe?: "today" | "week" | "month" | "year" | "till_date";
  showOverdueOnly?: boolean;
}