import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="min-h-screen bg-hero-gradient flex items-center justify-center text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Professionelle<br />
          <span className="text-secondary">Reinigungsdienste</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
          Vertrauen Sie auf unsere Expertise für makellos saubere Räume. 
          Wir sorgen für Sauberkeit, die beeindruckt.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-4"
          >
            Kostenlos anfragen
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary"
          >
            Mehr erfahren
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;