"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
const headers_1 = require("next/headers");
const ssr_1 = require("@supabase/ssr");
const config_1 = require("./config");
async function createSupabaseServerClient() {
    const cookieStore = await (0, headers_1.cookies)();
    const { url, anonKey } = (0, config_1.getSupabaseConfig)();
    return (0, ssr_1.createServerClient)(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                }
                catch (_a) {
                    // Server Components cannot always mutate cookies. Middleware refreshes them.
                }
            }
        }
    });
}
