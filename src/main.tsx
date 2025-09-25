import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Neue Version verfügbar! Jetzt aktualisieren?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App bereit für Offline-Nutzung');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
