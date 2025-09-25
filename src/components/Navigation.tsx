import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">
          Amela Reinigungsportal
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-foreground hover:text-primary transition-colors">
            Dienstleistungen
          </a>
          <a href="#about" className="text-foreground hover:text-primary transition-colors">
            Über uns
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">
            Kontakt
          </a>
        </div>
        
        <Button variant="default" className="hidden md:block">
          Angebot anfordern
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;