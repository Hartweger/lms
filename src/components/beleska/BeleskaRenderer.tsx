import { Fragment, type ReactNode } from "react";
import {
  WORTSCHATZ_AFTER,
  visibleSections,
  type NoteContent,
  type VisibleSection,
  type WortschatzRow,
} from "@/lib/class-notes";
import { parseBlocks, tokenizeInline, type Block, type InlineToken } from "@/lib/beleska-markup";

/**
 * Prikaz beleške sa 1:1 časa - samo čitanje, bez stanja, bez baze.
 * Prazna sekcija se ne prikazuje (ni naslov ni sadržaj) - to već rešava visibleSections().
 * Nikad dangerouslySetInnerHTML - sadržaj ide iz tokena parseBlocks/tokenizeInline u React čvorove.
 */

function renderInline(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.kind) {
      case "bold":
        return <strong key={i}>{t.text}</strong>;
      case "italic":
        return <em key={i}>{t.text}</em>;
      case "mark":
        return (
          <mark key={i} className="rounded-sm bg-koral-light px-1 text-gray-900">
            {t.text}
          </mark>
        );
      case "link":
        return (
          <a
            key={i}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-plava underline underline-offset-2"
          >
            {t.text}
          </a>
        );
      case "text":
      default:
        return t.text;
    }
  });
}

function renderBlocks(blocks: Block[]): ReactNode {
  return blocks.map((block, bi) => {
    if (block.kind === "ul") {
      return (
        <ul key={bi} className="list-disc space-y-1 pl-5 text-gray-700">
          {block.items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="leading-relaxed text-gray-700">
        {block.lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {renderInline(line)}
          </Fragment>
        ))}
      </p>
    );
  });
}

function TextSectionCard({ section }: { section: VisibleSection }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 md:p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {section.label}
      </p>
      <div className="space-y-2">{renderBlocks(parseBlocks(section.value))}</div>
    </div>
  );
}

function WortschatzTable({
  rows,
  wordsetHref,
}: {
  rows: WortschatzRow[];
  wordsetHref?: string;
}) {
  return (
    <div className="rounded-xl border border-plava-light bg-plava-light p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          WORTSCHATZ <span className="font-normal normal-case text-gray-500">· {rows.length} {rows.length === 1 ? "reč" : "reči"}</span>
        </p>
        {wordsetHref && (
          <a
            href={wordsetHref}
            className="rounded-full bg-plava px-4 py-1.5 text-sm font-semibold text-white hover:bg-plava-dark"
          >
            Vežbaj ove reči
          </a>
        )}
      </div>
      <div className="overflow-hidden rounded-lg bg-white">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-1/2 border-b border-gray-100 px-3 py-2 text-left font-medium text-gray-500">
                Nemački
              </th>
              <th scope="col" className="w-1/2 border-b border-gray-100 px-3 py-2 text-left font-medium text-gray-500">
                Naš
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                <td className="break-words px-3 py-2 align-top font-semibold text-gray-900">{row.de}</td>
                <td className="break-words px-3 py-2 align-top text-gray-600">{row.sr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BeleskaRenderer({
  content,
  wordsetHref,
}: {
  content: NoteContent;
  wordsetHref?: string;
}) {
  const sections = visibleSections(content);
  const words = content.wortschatz ?? [];

  if (sections.length === 0 && words.length === 0) {
    return (
      <p className="text-sm text-gray-500">Profesorka još nije upisala belešku za ovaj čas.</p>
    );
  }

  const afterSectionVisible = sections.some((s) => s.key === WORTSCHATZ_AFTER);
  const wortschatzTable =
    words.length > 0 ? <WortschatzTable rows={words} wordsetHref={wordsetHref} /> : null;

  return (
    <div className="space-y-4">
      {!afterSectionVisible && wortschatzTable}
      {sections.map((section) => (
        <Fragment key={section.key}>
          <TextSectionCard section={section} />
          {section.key === WORTSCHATZ_AFTER && wortschatzTable}
        </Fragment>
      ))}
    </div>
  );
}
