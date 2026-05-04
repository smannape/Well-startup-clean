import type { Snapshot, Workover, Perforation } from "./types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api";

let snapshotCache: Snapshot | null = null;
let workoverCache: Record<string, Workover[]> | null = null;
let perfCache: Record<string, Perforation[]> | null = null;

async function tryApi(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function fetchSnapshot(): Promise<Snapshot> {
  if (snapshotCache) return snapshotCache;
  if (await tryApi()) {
    const r = await fetch(`${API_BASE}/snapshot`);
    if (r.ok) {
      snapshotCache = await r.json();
      return snapshotCache!;
    }
  }
  // static fallback
  const r = await fetch("/data.json");
  snapshotCache = await r.json();
  return snapshotCache!;
}

export async function fetchWorkovers(): Promise<Record<string, Workover[]>> {
  if (workoverCache) return workoverCache;
  const r = await fetch("/workovers.json");
  workoverCache = await r.json();
  return workoverCache!;
}

export async function fetchPerforations(): Promise<Record<string, Perforation[]>> {
  if (perfCache) return perfCache;
  const r = await fetch("/perforations.json");
  perfCache = await r.json();
  return perfCache!;
}
