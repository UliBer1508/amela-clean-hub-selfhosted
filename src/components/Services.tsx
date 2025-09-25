import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Building, Home, Car } from "lucide-react";

const services = [
  {
    icon: <Building className="w-12 h-12 text-primary" />,
    title: "Büroreinigung",
    description: "Professionelle Reinigung von Büroräumen, Konferenzräumen und Arbeitsplätzen für ein produktives Arbeitsumfeld.",
  },
  {
    icon: <Home className="w-12 h-12 text-primary" />,
    title: "Haushaltsreinigung",
    description: "Gründliche Reinigung Ihres Zuhauses mit höchsten Qualitätsstandards und umweltfreundlichen Produkten.",
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: "Grundreinigung",
    description: "Intensive Tiefenreinigung für Neueinzüge, nach Renovierungen oder als regelmäßige Auffrischung.",
  },
  {
    icon: <Car className="w-12 h-12 text-primary" />,
    title: "Spezialreinigung",
    description: "Individuelle Reinigungslösungen für besondere Anforderungen und schwer erreichbare Bereiche.",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Unsere Dienstleistungen
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Von der regelmäßigen Büroreinigung bis zur einmaligen Grundreinigung – 
            wir bieten maßgeschneiderte Lösungen für jeden Bedarf.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="bg-service-card hover:bg-service-card-hover transition-all duration-300 hover:shadow-medium group cursor-pointer"
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;