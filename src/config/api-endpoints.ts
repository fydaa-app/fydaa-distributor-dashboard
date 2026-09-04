export const AuthEndpoints = {
  LOGIN: "/arn/login",
  IMPERSONATE_CONSUME: "/arn/impersonate/consume",
} as const;

export const ArnClientEndpoints = {
  CLIENTS: "/arn/clients",
  CLIENT_DETAIL: "/arn/client/{clientId}",
  SHARE_REPORT: "/arn/clients/{clientId}/share-report",
  NEW_SIP: "/arn/clients/{clientId}/sips",
} as const;

export const ArnSipBookEndpoints = {
  SIP_BOOK: "/arn/sip-book",
} as const;

export const ArnOrderEndpoints = {
  ORDERS: "/arn/orders",
} as const;

export const ArnCommissionEndpoints = {
  COMMISSION_KPIS: "/arn/commission/kpis",
  COMMISSION_TREND: "/arn/commission/trend",
  COMMISSION_AMC_SPLIT: "/arn/commission/amc-split",
  COMMISSION_LEDGER: "/arn/commission/ledger",
} as const;

export const ArnReportEndpoints = {
  REPORTS: "/arn/reports",
  QUICK_REPORTS: "/arn/reports/quick-reports",
} as const;

export const ArnShareEndpoints = {
  SHARE_KPIS: "/arn/share/kpis",
  RECENT_SHARES: "/arn/share/recent",
  SEND: "/arn/share/send",
  RESEND: "/arn/share/{shareId}/resend",
} as const;

export const ArnDashboardEndpoints = {
  DASHBOARD: "/arn/dashboard",
} as const;

export const ArnLeadEndpoints = {
  LEAD_USER_LIST: "/arn/lead-user-list",
} as const;

export const ArnGoalSetupEndpoints = {
  CLIENTS: "/arn/goal-sip-setup-client-list",
} as const;

export const ArnHierarchyEndpoints = {
  HIERARCHY: "/arn/hierarchy",
} as const;
