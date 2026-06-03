import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PORTAL_EMAIL = import.meta.env.VITE_PORTAL_EMAIL as string | undefined;
const PORTAL_PASSWORD = import.meta.env.VITE_PORTAL_PASSWORD as string | undefined;

/**
 * Unsichtbarer Auto-Login für das Amela-Portal.
 *
 * Prüft beim App-Start die bestehende Session und meldet sich bei Bedarf
 * still mit dem technischen Account aus VITE_PORTAL_EMAIL/VITE_PORTAL_PASSWORD an.
 *
 * Hinweis: VITE_*-Variablen sind im Client-Bundle sichtbar — bewusster
 * UX-Kompromiss, damit Putzkräfte sich nicht anmelden müssen.
 */
export function usePortalAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!PORTAL_EMAIL || !PORTAL_PASSWORD) {
          console.error(
            "Portal-Auto-Login: VITE_PORTAL_EMAIL oder VITE_PORTAL_PASSWORD ist nicht gesetzt."
          );
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error } = await supabase.auth.signInWithPassword({
            email: PORTAL_EMAIL,
            password: PORTAL_PASSWORD,
          });
          if (error) {
            console.error("Portal-Auto-Login fehlgeschlagen:", error.message);
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
