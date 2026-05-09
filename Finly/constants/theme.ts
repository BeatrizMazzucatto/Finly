// Finly Theme - Sistema de cores premium
export const Colors = {
  // Cor primária - Verde Esmeralda (confiança financeira)
  primary: "#059669",
  primaryLight: "#10B981",
  primaryDark: "#047857",

  // Cores de suporte
  secondary: "#0EA5E9",
  accent: "#F59E0B",

  // Backgrounds
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  // Textos
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Bordas
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Estados
  success: "#22C55E",
  successLight: "#DCFCE7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Categorias de transação
  income: "#22C55E",
  incomeLight: "#DCFCE7",
  expense: "#EF4444",
  expenseLight: "#FEE2E2",

  // Cores por categoria
  categories: {
    alimentacao: "#FF6B6B",
    transporte: "#4D96FF",
    saude: "#FF4A4A",
    lazer: "#9D4EDD",
    moradia: "#FF8C00",
    educacao: "#00CED1",
    compras: "#FF69B4",
    servicos: "#32CD32",
    salario: "#118AB2",
    investimentos: "#2A9D8F",
    outros: "#94A3B8",
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
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};