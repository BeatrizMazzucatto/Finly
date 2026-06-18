import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Transaction } from "@/src/types/api";

function escapeCsvValue(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const header = "ID,Titulo,Valor,Data,Tipo,Categoria\n";
  const rows = transactions.map((t) =>
    [
      t.id_transacao,
      escapeCsvValue(t.titulo),
      t.valor,
      t.data_transacao,
      t.tipo,
      escapeCsvValue(t.categoria),
    ].join(",")
  );

  return `\uFEFF${header}${rows.join("\n")}`;
}

export function getBackupFileName(carteiraType: "PESSOAL" | "CONJUNTA"): string {
  const date = new Date().toISOString().split("T")[0];
  return `finly_backup_${carteiraType.toLowerCase()}_${date}.csv`;
}

export async function exportCsvBackup(
  csvContent: string,
  fileName: string,
  carteiraLabel: string
): Promise<"shared" | "downloaded"> {
  if (Platform.OS === "web") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return "downloaded";
  }

  const file = new File(Paths.cache, fileName);
  file.write(csvContent);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: `Backup Finly - Carteira ${carteiraLabel}`,
    UTI: "public.comma-separated-values-text",
  });

  return "shared";
}
