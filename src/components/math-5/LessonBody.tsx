"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { PluggableList } from "unified";
import type { CalloutVariant, LessonBlock } from "@/data/math-5/types";
import { LessonFigure } from "@/components/math-5/LessonFigure";
import Link from "next/link";

const rehypeKatexPlugins: PluggableList = [[rehypeKatex, { errorColor: "currentColor" }]];

function MathText({ text, inline }: { text: string; inline?: boolean }) {
  const content = useMemo(() => text, [text]);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={rehypeKatexPlugins}
      components={{
        p: ({ children }) => (inline ? <span>{children}</span> : <p className="leading-relaxed">{children}</p>),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        a: ({ href, children }) => (
          <Link href={href ?? "#"} className="text-primary underline-offset-2 hover:underline">
            {children}
          </Link>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { wrap: string; label: string; defaultTitle: string }
> = {
  remember: {
    wrap: "border-sky-300 bg-sky-50 text-sky-950",
    label: "text-sky-700",
    defaultTitle: "Запомни",
  },
  example: {
    wrap: "border-emerald-300 bg-emerald-50 text-emerald-950",
    label: "text-emerald-700",
    defaultTitle: "Пример",
  },
  mistake: {
    wrap: "border-rose-300 bg-rose-50 text-rose-950",
    label: "text-rose-700",
    defaultTitle: "Частая ошибка",
  },
};

function Callout({
  variant,
  title,
  text,
}: {
  variant: CalloutVariant;
  title?: string;
  text: string;
}) {
  const style = CALLOUT_STYLES[variant];
  return (
    <aside className={`my-6 rounded-2xl border-l-4 p-4 sm:p-5 ${style.wrap}`}>
      <p className={`mb-2 text-sm font-bold uppercase tracking-wide ${style.label}`}>
        {title ?? style.defaultTitle}
      </p>
      <div className="lesson-math text-[0.95rem] leading-relaxed [&_.katex]:text-[1.05em]">
        <MathText text={text} />
      </div>
    </aside>
  );
}

function CheckBlock({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group my-4 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer list-none p-4 font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-3">
          <span className="lesson-math">
            <MathText text={question} inline />
          </span>
          <span className="shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3 text-muted-foreground">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Ответ</p>
        <div className="lesson-math">
          <MathText text={answer} />
        </div>
      </div>
    </details>
  );
}

export function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="lesson-math space-y-4 text-foreground [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="mb-3 mt-10 text-2xl font-bold text-foreground first:mt-0">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mb-2 mt-7 text-xl font-semibold text-foreground">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <div key={i} className="leading-relaxed">
                <MathText text={block.text} />
              </div>
            );
          case "ul":
            return (
              <ul key={i} className="my-3 space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j} className="list-disc leading-relaxed">
                    <MathText text={item} inline />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="my-3 list-decimal space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    <MathText text={item} inline />
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <Callout key={i} variant={block.variant} title={block.title} text={block.text} />
            );
          case "figure":
            return <LessonFigure key={i} id={block.id} caption={block.caption} />;
          case "check":
            return <CheckBlock key={i} question={block.question} answer={block.answer} />;
          case "link":
            return (
              <p key={i} className="my-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                {block.note ? <span className="text-muted-foreground">{block.note} </span> : null}
                <Link href={block.href} className="font-medium text-primary hover:underline">
                  {block.label}
                </Link>
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
