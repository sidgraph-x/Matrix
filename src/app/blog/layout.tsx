import Navbar from "@/components/Navbar";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackgroundEffects />
      <Navbar />
      {children}
    </>
  );
}
