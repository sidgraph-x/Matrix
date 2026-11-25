import type { Metadata } from "next";
import { PROBLEMS } from "@/lib/challenges";
import AtlasIndex from "@/components/challenges/AtlasIndex";

export const metadata: Metadata = {
  title: "Open problems in energy × AI infrastructure — Matrix",
  description: "An illustrated atlas of 42 open problems where energy, materials and AI infrastructure meet, each with a working figure.",
};

export default function ChallengesPage() {
  const cards = PROBLEMS.map(({ id, slug, type, group, title, question }) => ({ id, slug, type, group, title, question }));
  return <AtlasIndex cards={cards} />;
}
