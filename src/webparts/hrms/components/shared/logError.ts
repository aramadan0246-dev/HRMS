/** Every silent .catch() in this app should route through here instead of hiding the error. */
export function logError(context: string, err: unknown): void {
  console.error(`[HRMS] ${context}:`, err);
}
