"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({ content, className = "" }: FormattedMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-xs bg-white">
              <table className="w-full text-left border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/80 text-slate-900 border-b border-slate-200 font-semibold">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-800 border-r border-slate-200 last:border-r-0">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 border-t border-slate-100 text-slate-700 border-r border-slate-100 last:border-r-0">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/40">{children}</tr>
          ),
          h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-slate-900 mt-3 mb-1.5 border-b border-slate-200 pb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 mt-2.5 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 text-slate-700 leading-relaxed font-normal">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700">{olChildren(children)}</ol>,
          li: ({ children }) => <li className="text-slate-700 leading-snug">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 bg-emerald-50/50 pl-3.5 py-2 my-3 text-emerald-950 text-xs rounded-r-lg italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function olChildren(children: React.ReactNode) {
  return children;
}
