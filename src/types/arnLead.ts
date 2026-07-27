export interface ArnLead {
  userId: number;
  userName: string;
  mobileNumber: string;
  managerName: string;
  onboardingDate: string;
  netWorth: number;
}

export interface ArnLeadsBackendResponse {
  page: number;
  limit: number;
  timeframe: string;
  periodStartDate: string;
  periodEndDate: string;
  totalUsers: number;
  users: ArnLead[];
}
