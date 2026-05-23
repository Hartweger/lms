import type { Section } from "@/lib/section-types";
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
    default:
      return null;
  }
}

export default function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => renderBlock(section, i))}
    </div>
  );
}
