const Footer = () => {
  return (
    <footer className="bg-background py-8">
      <div className="container mx-auto px-4 text-center">
        <p 
          className="text-sm font-medium"
          style={{
            background: 'linear-gradient(90deg, #a8d8ea, #aa96da, #fcbad3, #ffffd2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Copyright © 2025 Steinbock Chalets
        </p>
      </div>
    </footer>
  );
};

export default Footer;
