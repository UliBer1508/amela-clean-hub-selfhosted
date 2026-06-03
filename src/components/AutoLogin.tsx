import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unsichtbarer Auto-Login für das Putzkräfte-Portal.
 *
 * Nutzt die ENV-Variablen VITE_PORTAL_EMAIL und VITE_PORTAL_PASSWORD,
 * damit die Putzkräfte sich nicht manuell anmelden müssen.
 *
 * Hinweis: VITE_*-Variablen sind im Client-Bundle sichtbar.
 * Das ist ein bewusster Kompromiss zugunsten der UX.
 */
const AutoLogin = () => {
  useEffect(() => {
    const email = import.meta.env.VITE_PORTAL_EMAIL as string | undefined;
    const password = import.meta.env.VITE_PORTAL_PASSWORD as string | undefined;

    if (!email || !password) {
      console.warn("[AutoLogin] VITE_PORTAL_EMAIL / VITE_PORTAL_PASSWORD nicht gesetzt.");
      return;
    }

    let cancelled = false;

    const ensureSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session) {
          // Session validieren — wenn ungültig, neu einloggen
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!cancelled && user && !error) return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("[AutoLogin] Login fehlgeschlagen:", signInError.message);
        }
      } catch (err) {
        console.error("[AutoLogin] Unerwarteter Fehler:", err);
      }
    };

    ensureSession();

    // Bei Sign-Out automatisch wieder einloggen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        supabase.auth.signInWithPassword({ email, password }).catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

export default AutoLogin;
