export interface Well {
  well_name: string;
  team?: string | null;
  area?: string | null;
  field?: string | null;
  reservoir?: string | null;
  pad?: string | null;
  facility?: string | null;
  well_type?: string | null;
  completion_type?: string | null;
  al_method?: string | null;
  operational_status?: string | null;
  operational_status_date?: string | null;
  seabed_reason?: string | null;
  reason_label: string;
  reason_severity: number;
  online_date?: string | null;
  esp_run_life?: number | null;
  allowable_rate?: number | null;
  latest_pgor_date?: string | null;
  latest_oil?: number | null;
  latest_liquid?: number | null;
  latest_wc?: number | null;
  latest_gor?: number | null;
  prev_oil?: number | null;
  prev_wc?: number | null;
  expected_oil?: number | null;
  potential_oil: number;
  oil_decline_pct?: number | null;
  days_since_pgor?: number | null;
  days_since_wo?: number | null;
  x?: number | null;
  y?: number | null;
  closed_action_activity?: string | null;
  closed_action_status?: string | null;
  pe_comment?: string | null;
  re_comment?: string | null;
  fd_action_plan?: string | null;
  fd_eng?: string | null;
  contractor?: string | null;
  install_date?: string | null;
  commission_date?: string | null;
  last_imp_activity?: string | null;
  last_imp_activity_date?: string | null;
  api_gravity?: number | null;
  perforation_count?: number;
  perf_top?: number | null;
  perf_bottom?: number | null;
  formations?: string | null;
  wo_count: number;
  last_wo_date?: string | null;
  total_wo_cost?: number | null;
  wc_risk?: number | null;
  equipment_risk?: number | null;
  wo_burden?: number | null;
  freshness?: number | null;
  startup_score: number;
  priority: "P1" | "P2" | "P3" | "P4" | "P5";
  priority_label: string;
}

export interface Workover {
  well_name: string;
  facility?: string;
  start_date?: string | null;
  end_date?: string | null;
  activity_type?: string | null;
  activity_code?: string | null;
  wellhead_type?: string | null;
  purpose?: string | null;
  summary?: string | null;
  remark?: string | null;
  cost?: number | null;
}

export interface Perforation {
  well_name: string;
  formation?: string | null;
  perf_date?: string | null;
  interval_start?: number | null;
  interval_end?: number | null;
  footage?: number | null;
  shots?: number | null;
  remarks?: string | null;
  status?: string | null;
  api_gravity?: number | null;
}

export interface KPIs {
  total_wells_inventory?: number;
  total_closed_wells: number;
  total_open_wells?: number;
  potential_oil_total_bopd: number;
  by_priority: Record<string, number>;
  by_facility: Record<string, number>;
  by_reason: Record<string, number>;
  by_al_method: Record<string, number>;
  by_contractor: Record<string, number>;
  by_reservoir?: Record<string, number>;
  by_team?: Record<string, number>;
  potential_by_priority: Record<string, number>;
  generated_at?: string;
}

export interface Snapshot {
  kpis: KPIs;
  wells: Well[];
}

export const PRIORITY_COLORS: Record<string, string> = {
  P1: "#ffb83d",
  P2: "#ff9849",
  P3: "#cf6b3a",
  P4: "#8a4a2b",
  P5: "#665544",
};

export const PRIORITY_LABEL: Record<string, string> = {
  P1: "Quick Win — GC Capacity",
  P2: "Surface Intervention",
  P3: "Rigless Workover",
  P4: "Rig Workover",
  P5: "Hold / RE Review",
};
