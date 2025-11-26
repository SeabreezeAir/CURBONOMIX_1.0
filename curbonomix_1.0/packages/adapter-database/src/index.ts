// Adapter Database Schema
// Stores pre-computed adapters for reuse

import type { MeshData, RTUSpec } from '@curbonomix/rtu-core';

export type AdapterRecord = {
  id: string; // unique identifier: `${existing_model}_TO_${new_model}`
  existing_model: string;
  new_model: string;
  existing_curb: {
    L: number;
    W: number;
    H: number;
  };
  new_curb: {
    L: number;
    W: number;
    H: number;
  };
  adapter_height: number;
  geometry: MeshData;
  performance: {
    cfm_supply: number;
    cfm_return: number;
    dp_inwc: number;
    vel_sup_fpm: number;
    vel_ret_fpm: number;
  };
  openings: {
    existing: {
      supply: { x: number; y: number; w: number; h: number };
      return: { x: number; y: number; w: number; h: number };
    };
    new: {
      supply: { x: number; y: number; w: number; h: number };
      return: { x: number; y: number; w: number; h: number };
    };
  };
  ai_analysis?: {
    cog_offset: number;
    wind_safety_factor: number;
    material_sqft: number;
    fabrication_complexity: string;
  };
  created_at: number; // timestamp
  reuse_count: number; // how many times this adapter has been requested
};

// In-memory adapter database (would be replaced with SQLite/PostgreSQL)
const adapterCache = new Map<string, AdapterRecord>();

export function generateAdapterId(existing_model: string, new_model: string): string {
  return `${existing_model.toUpperCase()}_TO_${new_model.toUpperCase()}`;
}

export function saveAdapter(record: Omit<AdapterRecord, 'id' | 'created_at' | 'reuse_count'>): AdapterRecord {
  const id = generateAdapterId(record.existing_model, record.new_model);
  const fullRecord: AdapterRecord = {
    ...record,
    id,
    created_at: Date.now(),
    reuse_count: 0
  };
  adapterCache.set(id, fullRecord);
  return fullRecord;
}

export function loadAdapter(existing_model: string, new_model: string): AdapterRecord | null {
  const id = generateAdapterId(existing_model, new_model);
  const record = adapterCache.get(id);
  if (record) {
    record.reuse_count++;
    return record;
  }
  return null;
}

export function listAdapters(): AdapterRecord[] {
  return Array.from(adapterCache.values()).sort((a, b) => b.reuse_count - a.reuse_count);
}

export function deleteAdapter(existing_model: string, new_model: string): boolean {
  const id = generateAdapterId(existing_model, new_model);
  return adapterCache.delete(id);
}

export function getAdapterStats() {
  const records = listAdapters();
  return {
    total: records.length,
    most_reused: records[0] || null,
    total_reuses: records.reduce((sum, r) => sum + r.reuse_count, 0)
  };
}

// Check if adapter exists
export function adapterExists(existing_model: string, new_model: string): boolean {
  const id = generateAdapterId(existing_model, new_model);
  return adapterCache.has(id);
}
