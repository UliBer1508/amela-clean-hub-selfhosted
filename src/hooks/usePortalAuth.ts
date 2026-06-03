import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unsichtbarer Auto-Login für das Amela-Portal.
 *
 * Prüft beim App-Start die bestehende Session und meldet sich bei Bedarf
 * still über die Edge Function `portal-login` an, die serverseitig mit den
 * Supabase-Secrets PORTAL_EMAIL/PORTAL_PASSWORD einloggt.
 */
export function usePortalAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("portal-login");
          if (fnError) {
            console.error("Portal-Auto-Login fehlgeschlagen:", fnError.message);
          } else if (fnData?.access_token && fnData?.refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token: fnData.access_token,
              refresh_token: fnData.refresh_token,
            });
            if (setErr) console.error("Portal-Session setzen fehlgeschlagen:", setErr.message);
          } else {
            console.error("Portal-Auto-Login: ungültige Antwort", fnData);
          }
        }
      } catch (e) {
        console.error("Portal-Auth-Fehler:", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
