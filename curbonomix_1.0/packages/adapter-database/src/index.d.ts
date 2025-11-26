import type { MeshData } from '@curbonomix/rtu-core';
export type AdapterRecord = {
    id: string;
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
            supply: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
            return: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
        };
        new: {
            supply: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
            return: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
        };
    };
    ai_analysis?: {
        cog_offset: number;
        wind_safety_factor: number;
        material_sqft: number;
        fabrication_complexity: string;
    };
    created_at: number;
    reuse_count: number;
};
export declare function generateAdapterId(existing_model: string, new_model: string): string;
export declare function saveAdapter(record: Omit<AdapterRecord, 'id' | 'created_at' | 'reuse_count'>): AdapterRecord;
export declare function loadAdapter(existing_model: string, new_model: string): AdapterRecord | null;
export declare function listAdapters(): AdapterRecord[];
export declare function deleteAdapter(existing_model: string, new_model: string): boolean;
export declare function getAdapterStats(): {
    total: number;
    most_reused: AdapterRecord;
    total_reuses: number;
};
export declare function adapterExists(existing_model: string, new_model: string): boolean;
