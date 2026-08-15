export type BrandConfig = {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
};

export const DEFAULT_BRAND: BrandConfig = {
  siteName: "TAKA69",
  logoUrl: "/icons/logo.png",
  faviconUrl: "/icons/favicon-32.png",
  telegramUrl: "https://t.me/",
  whatsappUrl: "https://wa.me/",
};

export function mergeBrand(raw: unknown): BrandConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<BrandConfig>;
  return {
    siteName: o.siteName || DEFAULT_BRAND.siteName,
    logoUrl: o.logoUrl || DEFAULT_BRAND.logoUrl,
    faviconUrl: o.faviconUrl || DEFAULT_BRAND.faviconUrl,
    telegramUrl: o.telegramUrl || DEFAULT_BRAND.telegramUrl,
    whatsappUrl: o.whatsappUrl || DEFAULT_BRAND.whatsappUrl,
  };
}
