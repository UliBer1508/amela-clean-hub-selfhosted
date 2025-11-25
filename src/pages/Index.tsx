import CleaningPortal from "./CleaningPortal";

interface IndexProps {
  chatProps: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
  };
}

const Index = ({ chatProps }: IndexProps) => {
  return <CleaningPortal chatProps={chatProps} />;
};

export default Index;
