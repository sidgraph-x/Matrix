import { IBM_Plex_Mono } from "next/font/google";
import "./atlas.css";

const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`atlas ${plexMono.variable}`}>
      <div className="wrap">{children}</div>
    </div>
  );
}
