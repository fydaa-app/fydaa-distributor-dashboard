export interface ArnDashboardEmployee {
  id: number | string;
  name: string;
  email: string;
  registrationType: string;
  euin: string | null;
}

export interface ArnDashboardSummary {
  totalAum: number;
  totalAumChangePercent: number;
  sipBookMonthly: number;
  newSips: number;
  trailEarned: number;
  trailEarnedChangePercent: number;
  trailEarnedPeriod: string;
  sipsAtRisk: number;
  clientCount: number;
}

export interface ArnDashboardAumTrend {
  month: string;
  aum: number;
}

export interface ArnDashboardSipBookItem {
  clientName: string;
  sipDay: string;
  amount: string;
  status: string;
  statusLabel?: string;
  userId?: number | string;
}

export interface ArnDashboardTopClient {
  clientName: string;
  aum: number;
  investmentModel: string;
  userId: number | string;
}

export interface ArnDashboardResponse {
  success: boolean;
  employee: ArnDashboardEmployee;
  summary: ArnDashboardSummary;
  aumTrend: ArnDashboardAumTrend[];
  sipBook: ArnDashboardSipBookItem[];
  topClientsByAum: ArnDashboardTopClient[];
}

export interface HierarchyOption {
  euinNumber: string;
  label: string;
  name: string;
  email: string;
  phone: string;
  level: string;
  status?: string;
  rejectionReason?: string;
  children?: HierarchyOption[];
}

export interface HierarchyResponse {
  viewer: {
    id: string | number;
    name: string;
    euinNumber: string;
  };
  canSwitch: boolean;
  defaultViewPartnerId: string | number;
  hierarchy: HierarchyOption[];
}