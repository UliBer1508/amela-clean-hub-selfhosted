import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  // Log to analytics instead of console in production
  useEffect(() => {
    // In production, you'd send this to your analytics service
    // analytics.track('404_error', { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Seite nicht gefunden</p>
        <Link 
          to="/" 
          className="text-primary hover:text-primary/80 underline story-link"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
