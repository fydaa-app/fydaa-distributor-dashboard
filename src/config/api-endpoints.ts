export const AuthEndpoints = {
  LOGIN: "/arn/login",
} as const;

export const ArnClientEndpoints = {
  CLIENT_KPIS: "/arn/clients/kpis",
  CLIENTS: "/arn/clients",
  CLIENT_DETAIL: "/arn/clients/{clientId}",
  SHARE_REPORT: "/arn/clients/{clientId}/share-report",
  NEW_SIP: "/arn/clients/{clientId}/sips",
} as const;

export const ArnSipBookEndpoints = {
  SIP_KPIS: "/arn/sipbook/kpis",
  SIP_TREND: "/arn/sipbook/trend",
  SIP_HEALTH: "/arn/sipbook/health",
  SIP_BOOK: "/arn/sipbook",
} as const;

export const ArnOrderEndpoints = {
  ORDERS_KPIS: "/arn/orders/kpis",
  ORDERS_ACTIVITY: "/arn/orders/activity",
  ORDERS_TYPE_SPLIT: "/arn/orders/type-split",
  ORDERS: "/arn/orders",
} as const;

export const ArnCommissionEndpoints = {
  COMMISSION_KPIS: "/arn/commission/kpis",
  COMMISSION_TREND: "/arn/commission/trend",
  COMMISSION_AMC_SPLIT: "/arn/commission/amc-split",
  COMMISSION_LEDGER: "/arn/commission/ledger",
} as const;

export const ArnReportEndpoints = {
  REPORT_PREVIEW: "/arn/reports/preview",
  PORTFOLIO_SUMMARY: "/arn/reports/portfolio-summary",
  EXPORT_CSV: "/arn/reports/portfolio-summary/export",
} as const;

export const ArnShareEndpoints = {
  SHARE_KPIS: "/arn/share/kpis",
  RECENT_SHARES: "/arn/share/recent",
  SEND: "/arn/share/send",
  RESEND: "/arn/share/{shareId}/resend",
} as const;
