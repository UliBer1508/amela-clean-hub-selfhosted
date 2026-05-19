export const CopyrightLine = ({ className = '' }: { className?: string }) => (
  <p className={`text-[10px] text-muted-foreground text-center ${className}`}>
    © 2025 Copy Right Steinbock Chalets
  </p>
);

const Footer = () => {
  return (
    <footer className="hidden sm:block bg-background py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-medium text-foreground">
          © 2025 Copy Right Steinbock Chalets
        </p>
      </div>
    </footer>
  );
};

export default Footer;
