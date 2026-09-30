export const AuthEndpoints = {
  LOGIN: "/arn/login",
  IMPERSONATE_CONSUME: "/arn/impersonate/consume",
  FORGOT_PASSWORD: "/arn/send-password-reset-otp",
  RESET_PASSWORD: "/arn/verify-otp-reset-password",
  CHANGE_PASSWORD: "/arn/change-password",
} as const;

export const ReferralEndpoints = {
  LEADS: "/referrals/leads",
  LEAD_STATS: "/referrals/leads/stats",
  LEAD_BY_ID: "/referrals/leads/{leadId}",
  LEAD_UPLOAD_IMAGE: "/referrals/leads/upload-image",
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

export const ArnPartnerEndpoints = {
  PROFILE_PHOTO: "/arn/partner/profile-photo",
} as const;

export const ArnLeadEndpoints = {
  LEAD_USER_LIST: "/arn/lead-user-list",
  PARTNER_LEADS: "/arn/leads/partner",
  PARTNER_LEAD_LIST: "/arn/leads",
  PARTNER_LEAD_BY_ID: "/arn/leads/{leadId}",
  PARTNER_LEAD_ASSIGN: "/arn/leads/{leadId}/assign-partner",
  PARTNER_LEAD_STATS: "/arn/leads/stats",
} as const;

export const ArnGoalSetupEndpoints = {
  CLIENTS: "/arn/goal-sip-setup-client-list",
} as const;

export const ArnHierarchyEndpoints = {
  HIERARCHY: "/arn/hierarchy",
} as const;
