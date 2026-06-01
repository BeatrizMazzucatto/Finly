export const Colors = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryDark: "#3B82F6",
  secondary: "#3B82F6",
  accent: "#F59E0B",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  textPrimary: "#1E293B",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textGray: "#64748B",
  textInverse: "#FFFFFF",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  income: "#10B981",
  incomeLight: "#D1FAE5",
  expense: "#EF4444",
  expenseLight: "#FEE2E2",

  jointPrimary: "#9333EA",
  jointLight: "#FAF5FF",
  jointGradientStart: "#9333EA",
  jointGradientEnd: "#C084FC",

  categories: {
    alimentacao: "#B91C1C",
    mercado: "#C2410C",
    transporte: "#1D4ED8",
    saude: "#15803D",
    lazer: "#B45309",
    moradia: "#4338CA",
    educacao: "#0369A1",
    compras: "#7E22CE",
    servicos: "#0E7490",
    salario: "#047857",
    investimentos: "#4D7C0F",
    outros: "#A21CAF",
  },

  categoryIcons: {
    alimentacao: "#EA580C",
    mercado: "#0284C7",
    transporte: "#0284C7",
    saude: "#CA8A04",
    lazer: "#DB2777",
    moradia: "#EA580C",
    educacao: "#0284C7",
    compras: "#DB2777",
    servicos: "#0284C7",
    salario: "#10B981",
    investimentos: "#10B981",
    outros: "#64748B",
  },
  light: {
    text: "#1E293B",
    background: "#F8FAFC",
    tint: "#4F46E5",
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#4F46E5",
  },
  dark: {
    text: "#F8FAFC",
    background: "#0F172A",
    tint: "#4F46E5",
    icon: "#94A3B8",
    tabIconDefault: "#475569",
    tabIconSelected: "#4F46E5",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
};
