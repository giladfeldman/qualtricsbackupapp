import JSZip from "jszip";
import type { BackupFile } from "@/lib/qualtrics/types";

export async function buildBackupZip(files: BackupFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function summarizeBackupFiles(files: BackupFile[]) {
  const folders = new Set<string>();

  for (const file of files) {
    const parts = file.path.split("/");
    if (parts.length > 1) {
      folders.add(parts[0]);
    }
  }

  return {
    fileCount: files.length,
    folders: Array.from(folders).sort(),
  };
}
