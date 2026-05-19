import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Automatische Updates ohne Benutzeraufforderung
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Alle 60 Sekunden auf neue Version prüfen
    const POLL_INTERVAL = 60 * 1000;
    setInterval(() => {
      registration.update().catch(() => {/* offline o.ä. — ignorieren */});
    }, POLL_INTERVAL);

    // Sofort prüfen, wenn der Tab wieder sichtbar/fokussiert wird
    const checkNow = () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', checkNow);
    window.addEventListener('focus', checkNow);
  },
  onNeedRefresh() {
    // Neue Version gefunden → still aktivieren und neu laden
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App bereit für Offline-Nutzung');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
