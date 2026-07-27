import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, STORAGE_KEY } from "../config";

/* storageKey próprio: a sessão deste app não se mistura com a do
   statsproleta no mesmo navegador. As permissões também são
   separadas (tabela copa_admins + função is_copa_admin no banco). */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
  },
});
