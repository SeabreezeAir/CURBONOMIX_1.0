// Adapter Database Schema
// Stores pre-computed adapters for reuse
// In-memory adapter database (would be replaced with SQLite/PostgreSQL)
const adapterCache = new Map();
export function generateAdapterId(existing_model, new_model) {
    return `${existing_model.toUpperCase()}_TO_${new_model.toUpperCase()}`;
}
export function saveAdapter(record) {
    const id = generateAdapterId(record.existing_model, record.new_model);
    const fullRecord = {
        ...record,
        id,
        created_at: Date.now(),
        reuse_count: 0
    };
    adapterCache.set(id, fullRecord);
    return fullRecord;
}
export function loadAdapter(existing_model, new_model) {
    const id = generateAdapterId(existing_model, new_model);
    const record = adapterCache.get(id);
    if (record) {
        record.reuse_count++;
        return record;
    }
    return null;
}
export function listAdapters() {
    return Array.from(adapterCache.values()).sort((a, b) => b.reuse_count - a.reuse_count);
}
export function deleteAdapter(existing_model, new_model) {
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
export function adapterExists(existing_model, new_model) {
    const id = generateAdapterId(existing_model, new_model);
    return adapterCache.has(id);
}
