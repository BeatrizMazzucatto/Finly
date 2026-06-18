import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import { buildTransactionsCsv, exportCsvBackup, getBackupFileName } from "@/src/services/backup";
import type { Transaction } from "@/src/types/api";

jest.mock("expo-file-system", () => {
  const writeMock = jest.fn();
  const fileUri = "file:///cache/finly_backup_pessoal_2026-06-18.csv";

  return {
    Paths: { cache: "file:///cache" },
    File: jest.fn().mockImplementation(() => ({
      write: writeMock,
      uri: fileUri,
    })),
    __writeMock: writeMock,
    __fileUri: fileUri,
  };
});

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const transactions: Transaction[] = [
  {
    id_transacao: 1,
    id_carteira: 10,
    titulo: 'Compra "especial"',
    tipo: "DESPESA",
    valor: 25.5,
    data_transacao: "2026-06-18",
    categoria: "Alimentação",
  },
];

describe("backup service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("monta CSV com cabeçalho e escape de aspas", () => {
    const csv = buildTransactionsCsv(transactions);

    expect(csv).toContain("ID,Titulo,Valor,Data,Tipo,Categoria");
    expect(csv).toContain('"Compra ""especial"""');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("gera nome de arquivo com tipo e data", () => {
    expect(getBackupFileName("PESSOAL")).toMatch(/^finly_backup_pessoal_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("exporta via compartilhamento no app nativo", async () => {
    Platform.OS = "ios";
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    const result = await exportCsvBackup("csv-content", "finly_backup_pessoal_2026-06-18.csv", "pessoal");

    expect(result).toBe("shared");
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      "file:///cache/finly_backup_pessoal_2026-06-18.csv",
      expect.objectContaining({
        mimeType: "text/csv",
        dialogTitle: "Backup Finly - Carteira pessoal",
      })
    );
  });

  it("falha quando compartilhamento não está disponível", async () => {
    Platform.OS = "android";
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await expect(
      exportCsvBackup("csv-content", "finly_backup_pessoal_2026-06-18.csv", "pessoal")
    ).rejects.toThrow("Compartilhamento não disponível neste dispositivo.");
  });
});
