'use client';

import React from 'react';
import { HelpBlock } from '@/types/help';
import HelpCallout from './HelpCallout';
import HelpSteps from './HelpSteps';
import HelpTable from './HelpTable';
import HelpFaq from './HelpFaq';
import HelpDiagram from './HelpDiagram';
import HelpVideo from './HelpVideo';
import HelpScreenshot from './HelpScreenshot';

interface HelpBlockRendererProps {
  blocks: HelpBlock[];
}

export default function HelpBlockRenderer({ blocks }: HelpBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6 text-slate-200">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p
                key={index}
                className="text-sm sm:text-base leading-relaxed text-slate-300 font-normal"
              >
                {block.text}
              </p>
            );

          case 'callout':
            return (
              <HelpCallout
                key={index}
                tone={block.tone}
                title={block.title}
                text={block.text}
              />
            );

          case 'steps':
            return (
              <HelpSteps
                key={index}
                title={block.title}
                items={block.items}
              />
            );

          case 'table':
            return (
              <HelpTable
                key={index}
                title={block.title}
                headers={block.headers}
                rows={block.rows}
              />
            );

          case 'faq':
            return <HelpFaq key={index} items={block.items} />;

          case 'diagram':
            return (
              <HelpDiagram
                key={index}
                title={block.title}
                mermaid={block.mermaid}
                caption={block.caption}
              />
            );

          case 'media':
            return (
              <HelpVideo
                key={index}
                src={block.src}
                poster={block.poster}
                caption={block.caption}
                mediaType={block.mediaType}
                loop={block.loop}
              />
            );

          case 'screenshot':
            return (
              <HelpScreenshot
                key={index}
                shotId={block.shotId}
                focusId={block.focusId}
                mode={block.mode}
                caption={block.caption}
                zoomPadding={block.zoomPadding}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
