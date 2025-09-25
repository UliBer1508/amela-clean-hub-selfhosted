import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: "Telefon",
      details: "+49 (0) 123 456 789",
      subtitle: "Mo-Fr: 8:00-18:00 Uhr"
    },
    {
      icon: <Mail className="w-6 h-6 text-primary" />,
      title: "E-Mail",
      details: "info@amela-reinigung.de",
      subtitle: "Antwort innerhalb 24h"
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary" />,
      title: "Standort",
      details: "Musterstraße 123",
      subtitle: "12345 Musterstadt"
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Notdienst",
      details: "24/7 verfügbar",
      subtitle: "Für Notfälle"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Kontakt aufnehmen
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lassen Sie uns über Ihre Reinigungsanforderungen sprechen. 
            Wir erstellen Ihnen gerne ein individuelles Angebot.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-8">
              Schnell und einfach anfragen
            </h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Vorname" className="bg-card" />
                <Input placeholder="Nachname" className="bg-card" />
              </div>
              <Input placeholder="E-Mail-Adresse" type="email" className="bg-card" />
              <Input placeholder="Telefonnummer" type="tel" className="bg-card" />
              <Textarea 
                placeholder="Beschreiben Sie Ihre Reinigungsanforderungen..." 
                rows={5}
                className="bg-card"
              />
              <Button size="lg" className="w-full text-lg py-4">
                Kostenlos anfragen
              </Button>
            </form>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-foreground mb-8">
              So erreichen Sie uns
            </h3>
            
            {contactInfo.map((info, index) => (
              <Card key={index} className="bg-service-card hover:bg-service-card-hover transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    {info.icon}
                    <span>{info.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-foreground font-medium mb-1">
                    {info.details}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {info.subtitle}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;