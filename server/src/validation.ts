export function text(value: unknown, max = 200): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
export function uuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
export function positiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
export const severities = ["low", "medium", "high", "critical"];
export const statuses = ["open", "in_progress", "closed"];
export function validSuggestion(value: unknown): value is {
  category: string;
  suggested_severity: string;
  suggested_team: string;
} {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    text(v.category, 80) &&
    severities.includes(v.suggested_severity as string) &&
    text(v.suggested_team, 100)
  );
}
