import { ArnClientEndpoints } from "@/config/api-endpoints";
import type {
  ArnActionResponse,
  ArnClient,
  ArnClientDetail,
  ArnClientSortKey,
  ArnClientsKpis,
  ArnClientsListParams,
  ArnGoal,
  ArnHolding,
  ArnKycStatus,
  ArnPaginatedResponse,
  ArnSipStatus,
  ArnTone,
  ArnTransaction,
  ArnTransactionStatus,
  ArnTransactionType,
} from "@/types/arnClient";

type JsonObject = Record<string, unknown>;

const PAGE_SIZE = 5;
const TOTAL_CLIENTS = 48;

const toneOrder: ArnTone[] = ["amber", "blue", "green", "teal", "purple", "red"];

const sampleClients: ArnClient[] = [
  {
    id: "rahul-sharma",
    name: "Rahul Sharma",
    initials: "RS",
    tone: "amber",
    aum: "₹62 L",
    aumInPaise: 6200000,
    sipMonthly: "₹15,000",
    sipMonthlyInPaise: 15000,
    xirr: 14.7,
    kycStatus: "done",
    kycLabel: "Done",
    sipStatus: "active",
    lastTransactionAt: "Today",
    lastTransactionLabel: "Today",
  },
  {
    id: "priya-gupta",
    name: "Priya Gupta",
    initials: "PG",
    tone: "blue",
    aum: "₹48 L",
    aumInPaise: 4800000,
    sipMonthly: "₹25,000",
    sipMonthlyInPaise: 25000,
    xirr: 12.1,
    kycStatus: "pending",
    kycLabel: "Pending",
    sipStatus: "due-today",
    lastTransactionAt: "5 Jun",
    lastTransactionLabel: "5 Jun",
  },
  {
    id: "nikhil-joshi",
    name: "Nikhil Joshi",
    initials: "NJ",
    tone: "green",
    aum: "₹39 L",
    aumInPaise: 3900000,
    sipMonthly: "₹0",
    sipMonthlyInPaise: 0,
    xirr: 9.8,
    kycStatus: "done",
    kycLabel: "Done",
    sipStatus: "none",
    lastTransactionAt: "1 Jun",
    lastTransactionLabel: "1 Jun",
  },
  {
    id: "sunita-mehta",
    name: "Sunita Mehta",
    initials: "SM",
    tone: "teal",
    aum: "₹31 L",
    aumInPaise: 3100000,
    sipMonthly: "₹5,000",
    sipMonthlyInPaise: 5000,
    xirr: 11.3,
    kycStatus: "done",
    kycLabel: "Done",
    sipStatus: "paused",
    lastTransactionAt: "20 May",
    lastTransactionLabel: "20 May",
  },
  {
    id: "amit-kumar",
    name: "Amit Kumar",
    initials: "AK",
    tone: "purple",
    aum: "₹28 L",
    aumInPaise: 2800000,
    sipMonthly: "₹10,000",
    sipMonthlyInPaise: 10000,
    xirr: 16.8,
    kycStatus: "done",
    kycLabel: "Done",
    sipStatus: "active",
    lastTransactionAt: "15 Jun",
    lastTransactionLabel: "15 Jun",
  },
];

const dummyClientsKpis: ArnClientsKpis = {
  totalClients: 48,
  activeSips: 62,
  kycPending: 4,
  avgAumPerClient: "₹8.75 L",
};

const rahulDetail: ArnClientDetail = {
  client: sampleClients[0],
  portfolioValue: "₹62 L",
  portfolioValueInPaise: 6200000,
  xirr: 14.7,
  monthlySip: "₹15,000",
  monthlySipInPaise: 15000,
  nextSipDate: "10 Jul 2026",
  clientSince: "Mar 2023",
  sipActive: true,
  kycComplete: true,
  holdings: [
    {
      fundName: "Mirae Asset Large Cap",
      category: "Large Cap",
      assetClass: "Equity",
      value: "₹18.4 L",
      valueInPaise: 1840000,
      xirr: 16.2,
      tone: "amber",
    },
    {
      fundName: "Parag Parikh Flexi Cap",
      category: "Flexi Cap",
      assetClass: "Equity",
      value: "₹14.8 L",
      valueInPaise: 1480000,
      xirr: 18.9,
      tone: "blue",
    },
    {
      fundName: "HDFC Short Term Debt",
      category: "Short Duration",
      assetClass: "Debt",
      value: "₹12.4 L",
      valueInPaise: 1240000,
      xirr: 7.1,
      tone: "green",
    },
    {
      fundName: "ICICI Pru Balanced Adv",
      category: "Dynamic Asset Alloc",
      assetClass: "Hybrid",
      value: "₹9.2 L",
      valueInPaise: 920000,
      xirr: 13.4,
      tone: "teal",
    },
  ],
  transactions: [
    {
      date: "10 Jun",
      fundName: "Mirae Asset Large Cap",
      type: "sip",
      amount: "₹8,000",
      amountInPaise: 8000,
      units: "42.3",
      status: "done",
      tone: "blue",
    },
    {
      date: "05 Jun",
      fundName: "Parag Parikh Flexi Cap",
      type: "sip",
      amount: "₹7,000",
      amountInPaise: 7000,
      units: "19.7",
      status: "done",
      tone: "blue",
    },
    {
      date: "01 Jun",
      fundName: "HDFC Short Term",
      type: "lumpsum",
      amount: "₹1,00,000",
      amountInPaise: 100000,
      units: "3,241",
      status: "done",
      tone: "purple",
    },
  ],
  goals: [
    {
      name: "Retirement corpus",
      saved: "₹48 L",
      savedInPaise: 4800000,
      target: "₹2 Cr",
      targetInPaise: 20000000,
      targetYear: 2040,
      progress: 24,
      tone: "amber",
    },
    {
      name: "Children's education",
      saved: "₹8.2 L",
      savedInPaise: 820000,
      target: "₹25 L",
      targetInPaise: 2500000,
      targetYear: 2032,
      progress: 33,
      tone: "blue",
    },
  ],
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function getNestedRecord(source: JsonObject | undefined, key: string): JsonObject | undefined {
  return source && isRecord(source[key]) ? source[key] : undefined;
}

function getArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(mapper);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTone(index: number): ArnTone {
  return toneOrder[index % toneOrder.length];
}

function getKycStatus(index: number): ArnKycStatus {
  if (index % 12 === 0) return "pending";
  if (index % 17 === 0) return "expired";
  return "done";
}

function getKycLabel(status: ArnKycStatus): string {
  if (status === "done") return "Done";
  if (status === "pending") return "Pending";
  if (status === "expired") return "Expired";
  return "Not started";
}

function getSipStatus(index: number): ArnSipStatus {
  if (index % 13 === 0) return "at-risk";
  if (index % 9 === 0) return "due-today";
  if (index % 11 === 0) return "paused";
  if (index % 5 === 0) return "none";
  return "active";
}

function createGeneratedClient(index: number): ArnClient {
  const names = [
    "Ananya Rao",
    "Vikram Singh",
    "Meera Nair",
    "Arjun Verma",
    "Neha Kapoor",
    "Rohan Das",
    "Isha Malhotra",
    "Karan Mehta",
    "Pooja Iyer",
    "Aditya Bose",
  ];
  const name = names[index % names.length];
  const suffix = Math.floor(index / names.length) + 1;
  const fullName = suffix > 1 ? `${name} ${suffix}` : name;
  const aumInPaise = 1200000 + index * 76000;
  const sipMonthlyInPaise = index % 6 === 0 ? 0 : 5000 + (index % 5) * 5000;
  const kycStatus = getKycStatus(index);

  return {
    id: `client-${index + 1}`,
    name: fullName,
    initials: getInitials(fullName),
    tone: getTone(index),
    aum: `₹${Math.round(aumInPaise / 100000)}.${String((aumInPaise / 10000) % 10).padStart(1, "0")} L`,
    aumInPaise,
    sipMonthly: sipMonthlyInPaise === 0 ? "₹0" : `₹${sipMonthlyInPaise.toLocaleString("en-IN")}`,
    sipMonthlyInPaise,
    xirr: Number((8.4 + (index % 10) * 0.7).toFixed(1)),
    kycStatus,
    kycLabel: getKycLabel(kycStatus),
    sipStatus: getSipStatus(index),
    lastTransactionAt: `${20 - (index % 18)} May`,
    lastTransactionLabel: `${20 - (index % 18)} May`,
  };
}

const dummyClients: ArnClient[] = Array.from({ length: TOTAL_CLIENTS }, (_, index) => {
  const sample = sampleClients[index];
  return sample || createGeneratedClient(index);
});

function getDummyClientsKpis(): ArnClientsKpis {
  return dummyClientsKpis;
}

function getDummyClients(params: ArnClientsListParams): ArnPaginatedResponse<ArnClient> {
  const search = (params.search || "").trim().toLowerCase();
  let items = [...dummyClients];

  if (search) {
    items = items.filter((client) => client.name.toLowerCase().includes(search));
  }

  if (params.kycStatus && params.kycStatus !== "all") {
    items = items.filter((client) => client.kycStatus === params.kycStatus);
  }

  if (params.sipStatus && params.sipStatus !== "all") {
    items = items.filter((client) => client.sipStatus === params.sipStatus);
  }

  const sortKey = params.sortKey || "aum";
  const sortDirection = params.sortDirection || "desc";

  items.sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const total = items.length;
  const page = Math.max(1, params.page);
  const pageSize = params.pageSize || PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total,
    page,
    pageSize,
  };
}

function getDummyClientDetail(clientId: string): ArnClientDetail {
  const client = dummyClients.find((item) => item.id === clientId);

  if (!client) {
    throw new Error("Client not found.");
  }

  if (client.id === "rahul-sharma") {
    return rahulDetail;
  }

  return {
    client,
    portfolioValue: client.aum,
    portfolioValueInPaise: client.aumInPaise,
    xirr: client.xirr,
    monthlySip: client.sipMonthly,
    monthlySipInPaise: client.sipMonthlyInPaise,
    nextSipDate: "10 Jul 2026",
    clientSince: "Mar 2023",
    sipActive: client.sipStatus === "active" || client.sipStatus === "due-today",
    kycComplete: client.kycStatus === "done",
    holdings: [
      {
        fundName: "Mirae Asset Large Cap",
        category: "Large Cap",
        assetClass: "Equity",
        value: "₹18.4 L",
        valueInPaise: 1840000,
        xirr: 16.2,
        tone: "amber",
      },
      {
        fundName: "Parag Parikh Flexi Cap",
        category: "Flexi Cap",
        assetClass: "Equity",
        value: "₹14.8 L",
        valueInPaise: 1480000,
        xirr: 18.9,
        tone: "blue",
      },
      {
        fundName: "HDFC Short Term Debt",
        category: "Short Duration",
        assetClass: "Debt",
        value: "₹12.4 L",
        valueInPaise: 1240000,
        xirr: 7.1,
        tone: "green",
      },
    ],
    transactions: [
      {
        date: "10 Jun",
        fundName: "Mirae Asset Large Cap",
        type: "sip",
        amount: "₹8,000",
        amountInPaise: 8000,
        units: "42.3",
        status: "done",
        tone: "blue",
      },
      {
        date: "05 Jun",
        fundName: "Parag Parikh Flexi Cap",
        type: "sip",
        amount: "₹7,000",
        amountInPaise: 7000,
        units: "19.7",
        status: "done",
        tone: "blue",
      },
    ],
    goals: [
      {
        name: "Retirement corpus",
        saved: "₹48 L",
        savedInPaise: 4800000,
        target: "₹2 Cr",
        targetInPaise: 20000000,
        targetYear: 2040,
        progress: 24,
        tone: "amber",
      },
      {
        name: "Children's education",
        saved: "₹8.2 L",
        savedInPaise: 820000,
        target: "₹25 L",
        targetInPaise: 2500000,
        targetYear: 2032,
        progress: 33,
        tone: "blue",
      },
    ],
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLatency<T>(value: T): Promise<T> {
  await delay(450);
  return value;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

function isApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ARN_CLIENTS_API_ENABLED === "true";
}

function replacePathParams(path: string, params: Record<string, string>): string {
  return Object.entries(params).reduce((url, [key, value]) => url.replace(`{${key}}`, value), path);
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

function normalizeTone(value: unknown, fallback: ArnTone = "amber"): ArnTone {
  const tone = getString(value);
  return ["amber", "green", "blue", "red", "purple", "teal"].includes(tone)
    ? (tone as ArnTone)
    : fallback;
}

function normalizeKycStatus(value: unknown): ArnKycStatus {
  const status = getString(value).toLowerCase();
  if (status === "pending") return "pending";
  if (status === "expired") return "expired";
  if (status === "not-started" || status === "not started") return "not-started";
  return "done";
}

function normalizeSipStatus(value: unknown): ArnSipStatus {
  const status = getString(value).toLowerCase();
  if (status === "paused") return "paused";
  if (status === "at-risk" || status === "risk" || status === "at risk") return "at-risk";
  if (status === "due-today" || status === "due today") return "due-today";
  if (status === "none") return "none";
  return "active";
}

function normalizeTransactionType(value: unknown): "sip" | "lumpsum" | "redemption" | "switch" {
  const type = getString(value).toLowerCase();
  if (type === "lumpsum") return "lumpsum";
  if (type === "redemption") return "redemption";
  if (type === "switch") return "switch";
  return "sip";
}

function normalizeTransactionStatus(value: unknown): ArnTransactionStatus {
  const status = getString(value).toLowerCase();
  if (status === "pending") return "pending";
  if (status === "failed") return "failed";
  if (status === "processing") return "processing";
  return "done";
}

function normalizeClient(source: JsonObject, fallbackIndex: number): ArnClient {
  const id = getString(source.id || source.clientId || source._id, `client-${fallbackIndex + 1}`);
  const name = getString(source.name || source.fullName, `Client ${fallbackIndex + 1}`);
  const kycStatus = normalizeKycStatus(source.kycStatus || source.kyc);
  const sipStatus = normalizeSipStatus(source.sipStatus || source.sip);
  const aumInPaise = getNumber(source.aumInPaise || source.aumValue || source.aum, 0);
  const sipMonthlyInPaise = getNumber(source.sipMonthlyInPaise || source.sipMonthlyValue || source.sipMonthly, 0);

  return {
    id,
    name,
    initials: getString(source.initials, getInitials(name)),
    tone: normalizeTone(source.tone || source.color, getTone(fallbackIndex)),
    aum: getString(source.aum, `₹${Math.round(aumInPaise / 100000)} L`),
    aumInPaise,
    sipMonthly: getString(source.sipMonthly, `₹${sipMonthlyInPaise.toLocaleString("en-IN")}`),
    sipMonthlyInPaise,
    xirr: getNumber(source.xirr, 0),
    kycStatus,
    kycLabel: getString(source.kycLabel || source.kycText, getKycLabel(kycStatus)),
    sipStatus,
    lastTransactionAt: getString(source.lastTransactionAt || source.lastTransaction, "—"),
    lastTransactionLabel: getString(source.lastTransactionLabel || source.lastTransactionText, "—"),
  };
}

function normalizeClientsKpisPayload(payload: unknown): ArnClientsKpis {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const totalClients = getNumber(data.totalClients || data.total_clients || data.total, 0);
  const activeSips = getNumber(data.activeSips || data.active_sips, 0);
  const kycPending = getNumber(data.kycPending || data.kyc_pending, 0);
  const avgAumPerClient = getString(data.avgAumPerClient || data.avg_aum_per_client, "₹0");

  return {
    totalClients,
    activeSips,
    kycPending,
    avgAumPerClient,
  };
}

function normalizeClientsListPayload(payload: unknown): ArnPaginatedResponse<ArnClient> {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const items = getArray(data.clients || data.items || data.results, (item) =>
    normalizeClient(isRecord(item) ? item : {}, 0)
  );
  const total = getNumber(data.total, items.length);
  const page = getNumber(data.page, 1);
  const pageSize = getNumber(data.pageSize || data.page_size, PAGE_SIZE);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

function normalizeHolding(source: JsonObject): ArnHolding {
  const valueInPaise = getNumber(source.valueInPaise || source.value, 0);

  return {
    fundName: getString(source.fundName || source.fund, "Fund"),
    category: getString(source.category, "—"),
    assetClass: getString(source.assetClass || source.asset_class, "—"),
    value: getString(source.valueText || source.value, `₹${Math.round(valueInPaise / 100000)} L`),
    valueInPaise,
    xirr: getNumber(source.xirr, 0),
    tone: normalizeTone(source.tone || source.color, "amber"),
  };
}

function normalizeTransaction(source: JsonObject): ArnTransaction {
  const amountInPaise = getNumber(source.amountInPaise || source.amount, 0);
  const type = normalizeTransactionType(source.type);
  const status = normalizeTransactionStatus(source.status);
  const toneMap: Record<ArnTransactionType, ArnTone> = {
    sip: "blue",
    lumpsum: "purple",
    redemption: "red",
    switch: "teal",
  };

  return {
    date: getString(source.date, "—"),
    fundName: getString(source.fundName || source.fund, "Fund"),
    type,
    amount: getString(source.amountText || source.amount, `₹${amountInPaise.toLocaleString("en-IN")}`),
    amountInPaise,
    units: getString(source.units, "—"),
    status,
    tone: normalizeTone(source.tone || source.color, toneMap[type]),
  };
}

function normalizeGoal(source: JsonObject): ArnGoal {
  const savedInPaise = getNumber(source.savedInPaise || source.saved, 0);
  const targetInPaise = getNumber(source.targetInPaise || source.target, 0);

  return {
    name: getString(source.name, "Goal"),
    saved: getString(source.savedText || source.saved, `₹${Math.round(savedInPaise / 100000)} L`),
    savedInPaise,
    target: getString(source.targetText || source.target, `₹${Math.round(targetInPaise / 100000)} L`),
    targetInPaise,
    targetYear: getNumber(source.targetYear || source.year, 0),
    progress: getNumber(source.progress, 0),
    tone: normalizeTone(source.tone || source.color, "amber"),
  };
}

function normalizeClientDetailPayload(payload: unknown): ArnClientDetail {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const clientSource = getNestedRecord(data, "client") || data;
  const client = normalizeClient(clientSource, 0);
  const portfolioValueInPaise = getNumber(
    data.portfolioValueInPaise || data.portfolio_value_in_paise || data.portfolioValue || client.aumInPaise,
    client.aumInPaise
  );
  const monthlySipInPaise = getNumber(
    data.monthlySipInPaise || data.monthly_sip_in_paise || data.monthlySip || client.sipMonthlyInPaise,
    client.sipMonthlyInPaise
  );

  return {
    client,
    portfolioValue: getString(data.portfolioValueText || data.portfolio_value || data.portfolioValue, client.aum),
    portfolioValueInPaise,
    xirr: getNumber(data.xirr, client.xirr),
    monthlySip: getString(data.monthlySipText || data.monthly_sip || data.monthlySip, client.sipMonthly),
    monthlySipInPaise,
    nextSipDate: getString(data.nextSipDate || data.next_sip_date, "—"),
    clientSince: getString(data.clientSince || data.client_since, "—"),
    sipActive: getBoolean(data.sipActive || data.sip_active, client.sipStatus === "active"),
    kycComplete: getBoolean(data.kycComplete || data.kyc_complete, client.kycStatus === "done"),
    holdings: getArray(data.holdings, (item) => normalizeHolding(isRecord(item) ? item : {})),
    transactions: getArray(data.transactions, (item) => normalizeTransaction(isRecord(item) ? item : {})),
    goals: getArray(data.goals, (item) => normalizeGoal(isRecord(item) ? item : {})),
  };
}

function normalizeActionResponse(payload: unknown): ArnActionResponse {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};

  return {
    ok: getBoolean(data.ok, true),
    message: getString(data.message, "Action completed."),
  };
}

async function getArnClientsKpisFromApi(signal?: AbortSignal): Promise<ArnClientsKpis> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnClientEndpoints.CLIENT_KPIS}`, {
    signal,
  });

  return normalizeClientsKpisPayload(payload);
}

async function getArnClientsFromApi(params: ArnClientsListParams, signal?: AbortSignal): Promise<ArnPaginatedResponse<ArnClient>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.kycStatus && params.kycStatus !== "all") searchParams.set("kycStatus", params.kycStatus);
  if (params.sipStatus && params.sipStatus !== "all") searchParams.set("sipStatus", params.sipStatus);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  if (params.sortKey) searchParams.set("sortKey", params.sortKey);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  const payload = await fetchJson<unknown>(
    `${getApiUrl()}${ArnClientEndpoints.CLIENTS}?${searchParams.toString()}`,
    { signal }
  );

  return normalizeClientsListPayload(payload);
}

async function getArnClientDetailFromApi(clientId: string, signal?: AbortSignal): Promise<ArnClientDetail> {
  const endpoint = replacePathParams(ArnClientEndpoints.CLIENT_DETAIL, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, { signal });

  return normalizeClientDetailPayload(payload);
}

async function shareArnClientReportFromApi(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  const endpoint = replacePathParams(ArnClientEndpoints.SHARE_REPORT, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, {
    method: "POST",
    signal,
  });

  return normalizeActionResponse(payload);
}

async function createArnClientSipRequestFromApi(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  const endpoint = replacePathParams(ArnClientEndpoints.NEW_SIP, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, {
    method: "POST",
    signal,
  });

  return normalizeActionResponse(payload);
}

export async function getArnClientsKpis(signal?: AbortSignal): Promise<ArnClientsKpis> {
  if (!isApiEnabled()) {
    return withLatency(getDummyClientsKpis());
  }

  return getArnClientsKpisFromApi(signal);
}

export async function getArnClients(
  params: ArnClientsListParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnClient>> {
  if (!isApiEnabled()) {
    return withLatency(getDummyClients(params));
  }

  return getArnClientsFromApi(params, signal);
}

export async function getArnClientDetail(clientId: string, signal?: AbortSignal): Promise<ArnClientDetail> {
  if (!isApiEnabled()) {
    return withLatency(getDummyClientDetail(clientId));
  }

  return getArnClientDetailFromApi(clientId, signal);
}

export async function shareArnClientReport(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  if (!isApiEnabled()) {
    return withLatency({ ok: true, message: "Report share request created." });
  }

  return shareArnClientReportFromApi(clientId, signal);
}

export async function createArnClientSipRequest(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  if (!isApiEnabled()) {
    return withLatency({ ok: true, message: "New SIP request created." });
  }

  return createArnClientSipRequestFromApi(clientId, signal);
}

export type { ArnClientSortKey };
