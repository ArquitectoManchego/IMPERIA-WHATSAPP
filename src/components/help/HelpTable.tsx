'use client';

import React from 'react';

interface HelpTableProps {
  title?: string;
  headers: string[];
  rows: string[][];
}

export default function HelpTable({ title, headers, rows }: HelpTableProps) {
  if (!headers || headers.length === 0 || !rows) return null;

  return (
    <div className="my-6 space-y-2">
      {title && (
        <h4 className="font-bold text-sm sm:text-base text-white tracking-tight">
          {title}
        </h4>
      )}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 shadow-xl custom-scrollbar">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-emerald-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-white/[0.04] transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-4 sm:px-6 py-3 leading-relaxed font-normal"
                  >
                    {cIdx === 0 ? (
                      <span className="font-semibold text-white">{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
