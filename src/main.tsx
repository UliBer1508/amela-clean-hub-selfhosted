import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Aggressivere Update-Prüfung für schnellere Updates
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Automatisch updaten ohne Bestätigung für nahtlose Updates
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App bereit für Offline-Nutzung');
  },
  onRegisteredSW(swUrl, r) {
    // Prüfe alle 60 Sekunden auf Updates
    r && setInterval(() => {
      r.update();
    }, 60000);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
