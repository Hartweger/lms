import type { Section } from "@/lib/section-types";
import type { Exercise, ExerciseQuestion } from "@/lib/types";
import InlineExercise from "./InlineExercise";
import BadgeBlock from "./BadgeBlock";
import VideoBlock from "./VideoBlock";
import TextBlock from "./TextBlock";
import FormulaBlock from "./FormulaBlock";
import TableBlock from "./TableBlock";
import MistakesBlock from "./MistakesBlock";
import SpoilerBlock from "./SpoilerBlock";
import VocabularyBlock from "./VocabularyBlock";
import PdfBlock from "./PdfBlock";
import ImageBlock from "./ImageBlock";
import LinkBlock from "./LinkBlock";
import FlashcardBlock from "./FlashcardBlock";
import YoutubeBlock from "./YoutubeBlock";
import AudioBlock from "./AudioBlock";

function renderBlock(section: Section, index: number) {
  switch (section.type) {
    case "badge":
      return <BadgeBlock key={index} {...section} />;
    case "video":
      return <VideoBlock key={index} {...section} />;
    case "text":
      return <TextBlock key={index} {...section} />;
    case "formula":
      return <FormulaBlock key={index} {...section} />;
    case "table":
      return <TableBlock key={index} {...section} />;
    case "mistakes":
      return <MistakesBlock key={index} {...section} />;
    case "spoiler":
      return <SpoilerBlock key={index} {...section} />;
    case "vocabulary":
      return <VocabularyBlock key={index} {...section} />;
    case "pdf":
      return <PdfBlock key={index} {...section} />;
    case "image":
      return <ImageBlock key={index} {...section} />;
    case "link":
      return <LinkBlock key={index} {...section} />;
    case "flashcard":
      return <FlashcardBlock key={index} {...section} />;
    case "youtube":
      return <YoutubeBlock key={index} {...section} />;
    case "audio":
      return <AudioBlock key={index} {...section} />;
    default:
      // Unknown section types from DB. Audio is handled earlier in the map
      // (see BlockRenderer below), so it never reaches here.
      return null;
  }
}

export type InlineExerciseMap = Record<string, { exercise: Exercise; questions: ExerciseQuestion[] }>;

export default function BlockRenderer({
  sections,
  inlineExercises,
  level,
}: {
  sections: Section[];
  inlineExercises?: InlineExerciseMap;
  level?: string;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        // Inline vežba: renderuj ExerciseRunner ispod sadržaja
        if (section.type === "exercise") {
          const found = inlineExercises?.[section.title];
          if (!found) return null;
          return <InlineExercise key={i} exercise={found.exercise} questions={found.questions} level={level} />;
        }
        // Handle audio sections that may not be recognized by TypeScript narrowing
        const s = section as unknown as Record<string, unknown>;
        if (s.type === "audio" && typeof s.url === "string") {
          return (
            <div key={i} className="bg-gray-50 rounded-xl p-4 md:p-5">
              {s.label ? <p className="text-sm font-semibold text-gray-700 mb-2">{String(s.label)}</p> : null}
              <audio controls className="w-full" preload="none">
                <source src={s.url} type="audio/mpeg" />
                Tvoj pregledač ne podržava audio player.
              </audio>
            </div>
          );
        }
        return renderBlock(section, i);
      })}
    </div>
  );
}
