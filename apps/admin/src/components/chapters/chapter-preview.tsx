"use client";

import { Modal } from "@/components/ui/modal";
import type { ChapterContent, Paragraph } from "@/lib/api/chapters";

function paragraphStyle(p: Paragraph): React.CSSProperties {
  return {
    fontWeight: p.isBold ? 700 : 400,
    fontStyle: p.isItalic ? "italic" : "normal",
    textDecoration: p.isUnderline ? "underline" : "none",
    textAlign: p.alignment as React.CSSProperties["textAlign"],
    fontSize: p.fontSize ? `${p.fontSize}px` : undefined,
    color: p.color || undefined,
    backgroundColor: p.backgroundColor || undefined,
    marginLeft: p.indent ? `${p.indent * 1.5}rem` : undefined,
  };
}

function ParagraphBlock({ paragraph }: { paragraph: Paragraph }) {
  const Tag =
    paragraph.style === "heading1"
      ? "h1"
      : paragraph.style === "heading2"
        ? "h2"
        : paragraph.style === "heading3"
          ? "h3"
          : paragraph.style === "quote"
            ? "blockquote"
            : "p";
  return (
    <Tag
      style={paragraphStyle(paragraph)}
      className={paragraph.style === "quote" ? "border-l-4 border-slate-300 pl-3 italic" : ""}
    >
      {paragraph.text}
    </Tag>
  );
}

export function ChapterPreviewModal({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ChapterContent | null | undefined;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xem trước: ${title}`}>
      {!content ? (
        <p className="text-slate-400">Chưa có nội dung.</p>
      ) : (
        <div className="prose prose-sm max-w-none space-y-3">
          {content.introduction && <p className="italic text-slate-600">{content.introduction}</p>}

          {content.paragraphs.map((p) => (
            <ParagraphBlock key={p.id} paragraph={p} />
          ))}

          {(content.images ?? []).map((image) => (
            <figure key={image.id} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText ?? ""} className="mx-auto max-w-full rounded-md" />
              {image.caption && <figcaption className="text-xs text-slate-400">{image.caption}</figcaption>}
            </figure>
          ))}

          {(content.tables ?? []).map((table) => (
            <table key={table.id} className="w-full border-collapse text-sm">
              {table.caption && (
                <caption className="text-xs text-slate-400">{table.caption}</caption>
              )}
              <thead>
                <tr>
                  {table.headers.map((h, i) => (
                    <th key={i} className="border border-slate-200 bg-slate-50 px-2 py-1 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-slate-200 px-2 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {content.conclusion && <p className="font-medium text-slate-700">{content.conclusion}</p>}

          {(content.footnotes ?? []).length > 0 && (
            <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
              {(content.footnotes ?? []).map((f) => (
                <p key={f.id}>
                  <sup>{f.reference}</sup> {f.content}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
