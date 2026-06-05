import { Loader2 } from "lucide-react";

/**
 * Fallback-Screen. Wird nur angezeigt, wenn das stille Auto-Login fehlschlägt
 * (z. B. falsche Credentials oder fehlende VITE_PORTAL_* Variablen).
 */
export default function PortalLogin() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Verbindung wird hergestellt…</p>
      </div>
    </div>
  );
}
