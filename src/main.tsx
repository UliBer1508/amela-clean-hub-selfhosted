import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Automatische Updates ohne Benutzeraufforderung
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App bereit für Offline-Nutzung');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
