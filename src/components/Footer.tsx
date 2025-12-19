const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Amela Reinigungsportal</h3>
            <p className="text-primary-foreground/80 mb-4 max-w-md">
              Ihr verlässlicher Partner für professionelle Reinigungsdienste. 
              Qualität und Kundenzufriedenheit stehen bei uns an erster Stelle.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>Büroreinigung</li>
              <li>Haushaltsreinigung</li>
              <li>Grundreinigung</li>
              <li>Spezialreinigung</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>+49 (0) 123 456 789</li>
              <li>info@amela-reinigung.de</li>
              <li>Musterstraße 123</li>
              <li>12345 Musterstadt</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © 2025 Steinbock Chalets. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;