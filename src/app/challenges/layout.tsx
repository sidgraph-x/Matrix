import Link from "next/link";
import { IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import "./atlas.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`atlas ${interTight.variable} ${plexMono.variable}`}>
      <div className="wrap">
        <div className="top">
          <Link href="/challenges">Energy × AI · open problems</Link>
          <Link href="/" className="home"><b>&#9670;</b> matrix</Link>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
