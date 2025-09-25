import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navigation = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          Amela Reinigungsportal
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/calendar" 
            className="text-foreground hover:text-primary transition-colors story-link"
          >
            Kalender
          </Link>
          <button 
            onClick={() => scrollToSection('services')}
            className="text-foreground hover:text-primary transition-colors story-link"
          >
            Dienstleistungen
          </button>
          <button 
            onClick={() => scrollToSection('about')}
            className="text-foreground hover:text-primary transition-colors story-link"
          >
            Über uns
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-foreground hover:text-primary transition-colors story-link"
          >
            Kontakt
          </button>
        </div>
        
        <Button variant="default" className="hidden md:block hover-scale">
          Angebot anfordern
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;