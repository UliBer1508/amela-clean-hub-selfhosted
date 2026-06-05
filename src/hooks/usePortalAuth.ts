import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const PORTAL_EMAIL = import.meta.env.VITE_PORTAL_EMAIL as string;
const PORTAL_PASSWORD = import.meta.env.VITE_PORTAL_PASSWORD as string;

/**
 * Portal-Session-Hook mit stillem Auto-Login.
 * Wenn keine Session besteht, loggt sich die App im Hintergrund mit
 * den in den VITE_PORTAL_* Variablen hinterlegten Credentials ein.
 */
export function usePortalSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session);
        setLoading(false);
        return;
      }

      if (!PORTAL_EMAIL || !PORTAL_PASSWORD) {
        console.error("[Portal] VITE_PORTAL_EMAIL/VITE_PORTAL_PASSWORD nicht gesetzt");
        setLoading(false);
        return;
      }

      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email: PORTAL_EMAIL,
        password: PORTAL_PASSWORD,
      });
      if (error) {
        console.error("[Portal] Auto-login failed:", error.message);
      } else {
        setSession(loginData.session);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
