/** Port of R: gsub("[^A-Za-z0-9]", "_", name) */
export function sanitizeSurveyFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "_");
}
