"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseConfig = getSupabaseConfig;
exports.isSupabaseConfigured = isSupabaseConfigured;
function getSupabaseConfig() {
    var _a, _b;
    return {
        url: (_a = process.env.NEXT_PUBLIC_SUPABASE_URL) !== null && _a !== void 0 ? _a : "",
        anonKey: (_b = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) !== null && _b !== void 0 ? _b : ""
    };
}
function isSupabaseConfigured() {
    const { url, anonKey } = getSupabaseConfig();
    return Boolean(url && anonKey);
}
