import { existsSync, unlinkSync } from "fs";
import type { File as MulterFile } from "multer";


export function buildFileUrl(
  base: string,
  folder: string,
  subfolder: string,
  filename: string
) {
  return `${base}/uploads/${folder}${subfolder}/${filename}`;
}
export function validateFileSize(
  file: MulterFile | undefined,
  maxSize: number,
  label: string
) 
{
  if (!file) return;
  if (file.size > maxSize) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(2);
    throw new Error(`${label} must be smaller than ${sizeMB} MB`);
  }
}
export function filterFilesByField(
  files: MulterFile[],
  field: string
) {
  return (files || []).filter((f) => f.fieldname === field);
}

export async function deleteOldFile(fileUrl: string, baseUrl: string) {
  try {
    const filePath = fileUrl.replace(baseUrl + "/", "");

    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}