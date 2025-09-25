import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Award, Clock } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <CheckCircle className="w-6 h-6 text-secondary" />,
      text: "Qualitätsgarantie bei jeder Reinigung"
    },
    {
      icon: <Users className="w-6 h-6 text-secondary" />,
      text: "Erfahrenes und geschultes Personal"
    },
    {
      icon: <Award className="w-6 h-6 text-secondary" />,
      text: "Zertifiziert und versichert"
    },
    {
      icon: <Clock className="w-6 h-6 text-secondary" />,
      text: "Flexible Termine und Notdienst"
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Warum Amela wählen?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Mit über 10 Jahren Erfahrung in der Reinigungsbranche stehen wir für 
              Qualität, Zuverlässigkeit und Kundenzufriedenheit. Unser Team aus 
              geschulten Fachkräften sorgt dafür, dass Ihre Räume immer in 
              bestem Zustand sind.
            </p>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {feature.icon}
                  <span className="text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <Button size="lg" className="text-lg px-8 py-4">
              Mehr über uns erfahren
            </Button>
          </div>
          
          <div className="relative">
            <div className="bg-primary/10 rounded-2xl p-8 shadow-medium">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-muted-foreground">Zufriedene Kunden</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">10+</div>
                  <div className="text-muted-foreground">Jahre Erfahrung</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-muted-foreground">Verfügbarkeit</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-muted-foreground">Qualitätsgarantie</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;