export type User = {
  id: number;
  name: string;
  email: string;
  role: "worker" | "supervisor" | "admin";
  site_id: number;
};
export type Site = { id: number; name: string; location: string };
export type Template = {
  id: number;
  name: string;
  site_type: string;
  question_count: number;
};
export type Question = {
  id: number;
  text: string;
  position: number;
  template_id: number;
};
export type Answer = {
  question_id: number;
  result: "pass" | "fail" | "na";
  note: string;
  photo_url?: string | null;
  text?: string;
};
export type Report = {
  id: string;
  title?: string;
  equipment_name?: string;
  template_name?: string;
  site_id: number;
  site_name?: string;
  user_id: number;
  status: string;
  severity?: string;
  category?: string;
  description?: string;
  created_at: string;
  photos?: string[];
  answers?: Answer[];
  reporter_name?: string;
  assigned_to?: number | null;
  assigned_name?: string;
  timeline?: { id: number; text: string; name: string; created_at: string }[];
  pending?: boolean;
  kind?: "incidents" | "inspections";
};
export type IncidentDraft = {
  id: string;
  title: string;
  site_id: number;
  severity: string;
  category: string;
  description: string;
  photos: string[];
};
export type InspectionDraft = {
  id: string;
  template_id: number;
  site_id: number;
  equipment_name: string;
  answers: Answer[];
};
export type Pending = {
  id: string;
  user_id: number;
  kind: "incidents" | "inspections";
  payload: string;
  synced: number;
  created_at: string;
};
export type Dashboard = {
  open_incidents: number;
  inspections_today: number;
  failed_inspections: number;
  days: { day: string; count: number }[];
  recent: Report[];
};
