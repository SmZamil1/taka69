import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";

export type PaymentChannel = {
  id: string;
  label: string;
  bonus?: number;
};

export type PaymentMethodConfig = {
  id: string;
  name: string;
  number: string;
  enabled: boolean;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  logo?: string;
  color?: string;
  type?: string;
  accountName?: string;
  instructionsEn?: string;
  instructionsBn?: string;
  warningEn?: string;
  warningBn?: string;
  feeType: "NONE" | "FIXED" | "PERCENT";
  feeValue: number;
  channels: PaymentChannel[];
  [key: string]: unknown;
};

export type PaymentConfig = {
  minDeposit: number;
  minWithdraw: number;
  maxDeposit: number;
  maxWithdraw: number;
  noticeEn: string;
  noticeBn: string;
  withdrawFeeType: "NONE" | "FIXED" | "PERCENT";
  withdrawFeeValue: number;
  methods: PaymentMethodConfig[];
};

const DEFAULT_CHANNELS: PaymentChannel[] = [
  { id: "standard", label: "Standard channel", bonus: 0 },
];

function asNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asFeeType(value: unknown): "NONE" | "FIXED" | "PERCENT" {
  return value === "FIXED" || value === "PERCENT" ? value : "NONE";
}

function normalizeChannels(raw: unknown): PaymentChannel[] {
  if (!Array.isArray(raw)) return DEFAULT_CHANNELS;
  const channels = raw
    .map((value, index) => {
      if (typeof value === "string") {
        const label = value.trim();
        return label ? { id: `channel-${index + 1}`, label, bonus: 0 } : null;
      }
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const label = String(item.label || item.name || "").trim();
      if (!label) return null;
      const id = String(item.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-")).slice(0, 50);
      return { id, label, bonus: Math.max(0, asNumber(item.bonus, 0)) };
    })
    .filter((value): value is { id: string; label: string; bonus: number } => !!value);
  return channels.length ? channels : DEFAULT_CHANNELS;
}

function normalizeMethod(value: unknown, index: number): PaymentMethodConfig | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = String(item.id || "").trim().toLowerCase();
  const name = String(item.name || id).trim();
  if (!id || !name) return null;
  return {
    ...item,
    id,
    name,
    number: String(item.number || "").trim(),
    enabled: item.enabled !== false,
    depositEnabled: item.depositEnabled !== false,
    withdrawEnabled: item.withdrawEnabled !== false,
    logo: typeof item.logo === "string" ? item.logo : undefined,
    color: typeof item.color === "string" ? item.color : undefined,
    type: typeof item.type === "string" ? item.type : undefined,
    accountName: typeof item.accountName === "string" ? item.accountName : undefined,
    instructionsEn: typeof item.instructionsEn === "string" ? item.instructionsEn : undefined,
    instructionsBn: typeof item.instructionsBn === "string" ? item.instructionsBn : undefined,
    warningEn: typeof item.warningEn === "string" ? item.warningEn : undefined,
    warningBn: typeof item.warningBn === "string" ? item.warningBn : undefined,
    feeType: asFeeType(item.feeType),
    feeValue: Math.max(0, asNumber(item.feeValue, 0)),
    channels: normalizeChannels(item.channels),
    sortOrder: asNumber(item.sortOrder, index + 1),
  };
}

export function normalizePaymentConfig(raw: unknown): PaymentConfig {
  const fallback = DEFAULT_PAYMENT_CONFIG as Record<string, unknown>;
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : fallback;
  const rawMethods = source.methods === undefined ? fallback.methods : source.methods;
  const methods = Array.isArray(rawMethods)
    ? rawMethods.map(normalizeMethod).filter((value): value is PaymentMethodConfig => !!value)
    : [];
  return {
    minDeposit: Math.max(1, asNumber(source.minDeposit, 100)),
    minWithdraw: Math.max(1, asNumber(source.minWithdraw, 200)),
    maxDeposit: Math.max(1, asNumber(source.maxDeposit, 100000)),
    maxWithdraw: Math.max(1, asNumber(source.maxWithdraw, 50000)),
    noticeEn: typeof source.noticeEn === "string" ? source.noticeEn : "",
    noticeBn: typeof source.noticeBn === "string" ? source.noticeBn : "",
    withdrawFeeType: asFeeType(source.withdrawFeeType),
    withdrawFeeValue: Math.max(0, asNumber(source.withdrawFeeValue, 0)),
    methods: methods.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
  };
}

export function findPaymentMethod(method: string, methods: PaymentMethodConfig[], direction?: "deposit" | "withdraw") {
  const wanted = method.trim().toLowerCase();
  return methods.find((item) => {
    const matches = item.id === wanted || item.name.toLowerCase() === wanted;
    if (!matches || !item.enabled) return false;
    if (direction === "deposit" && !item.depositEnabled) return false;
    if (direction === "withdraw" && !item.withdrawEnabled) return false;
    return true;
  });
}

export function calculateFee(amount: number, method?: PaymentMethodConfig, config?: PaymentConfig) {
  const type = method?.feeType && method.feeType !== "NONE" ? method.feeType : config?.withdrawFeeType || "NONE";
  const value = method?.feeType && method.feeType !== "NONE" ? method.feeValue : config?.withdrawFeeValue || 0;
  if (type === "PERCENT") return Number(((amount * value) / 100).toFixed(2));
  if (type === "FIXED") return Number(Math.max(0, value).toFixed(2));
  return 0;
}
