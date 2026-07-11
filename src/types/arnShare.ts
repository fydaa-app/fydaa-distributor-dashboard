import type { ArnActionResponse, ArnPaginatedResponse, ArnTone } from "@/types/arnClient";
import type { ArnReportType } from "@/types/arnReports";

export type ArnShareChannel = "whatsapp" | "email" | "copy-link" | "download-pdf";

export type ArnShareContentKey =
  | "portfolio-valuation"
  | "xirr-returns"
  | "sip-schedule"
  | "capital-gains";

export interface ArnShareKpis {
  reportsShared: number;
  reportsSharedTrend: string;
  viewedByClients: number;
  viewedRate: string;
  whatsappSends: number;
  whatsappLabel: string;
}

export interface ArnShareClientOption {
  id: string;
  name: string;
  initials: string;
  tone: ArnTone;
  aum: string;
  xirr: number;
}

export interface ArnRecentShare {
  id: string;
  clientId: string;
  clientName: string;
  clientShortName: string;
  initials: string;
  tone: ArnTone;
  reportType: string;
  reportTypeKey: ArnReportType;
  channel: ArnShareChannel;
  channelLabel: string;
  sentOn: string;
  viewed: boolean;
}

export interface ArnSharePayload {
  clientIds: string[];
  channel: ArnShareChannel;
  content: ArnShareContentKey[];
  reportType?: ArnReportType;
}

export interface ArnRecentSharesParams {
  page: number;
  pageSize: number;
}

export type ArnRecentSharesResponse = ArnPaginatedResponse<ArnRecentShare>;

export type ArnShareResponse = ArnActionResponse;
