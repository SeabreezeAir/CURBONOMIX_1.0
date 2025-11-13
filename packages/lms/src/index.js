// packages/lms/src/index.ts
// Small helpers
export const success = (data) => ({ ok: true, data });
export const failure = (error, data) => ({ ok: false, error, data });
