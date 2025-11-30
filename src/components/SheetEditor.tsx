import React, { useMemo, useRef, useEffect } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { evaluateSheet, formatValue } from '../utils/mathEngine';

export const SheetEditor: React.FC = () => {
  const { activeSheetId, sheets, updateSheetContent } = useSheetStore();
  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // If no sheet found (deleted?), fallback or show empty
  if (!activeSheet) return <div className="p-4 text-gray-900 dark:text-white">No sheet selected</div>;

  const content = activeSheet.content || '';
  const lines = content.split('\n');

  // Evaluate all lines
  const results = useMemo(() => evaluateSheet(lines), [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSheetContent(activeSheetId, e.target.value);
  };
  
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const { scrollTop, scrollLeft } = e.currentTarget;
      if (overlayRef.current) {
          overlayRef.current.scrollTop = scrollTop;
          overlayRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = scrollTop;
      }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] text-gray-900 dark:text-white font-mono transition-colors duration-300">
      {/* Editor Container */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Line Numbers */}
        <div 
            ref={lineNumbersRef}
            className="w-12 flex-shrink-0 bg-white dark:bg-[#141414] border-r border-gray-200 dark:border-[#303030] text-gray-400 dark:text-gray-600 text-right py-4 pr-3 select-none overflow-hidden leading-7 transition-colors duration-300"
        >
            {lines.map((_, i) => (
                <div key={i} className="h-7">{i + 1}</div>
            ))}
            {/* Extra space at bottom */}
            <div className="h-[50vh]"></div>
        </div>

        {/* Editor Area Wrapper */}
        <div className="flex-1 relative min-w-0">
            
            {/* Text Area (Input) */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full bg-transparent text-gray-900 dark:text-gray-200 p-4 border-none outline-none resize-none leading-7 whitespace-pre overflow-auto custom-scrollbar placeholder-gray-400 z-10 font-mono"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
            />

            {/* Results Overlay */}
            <div 
                ref={overlayRef}
                className="absolute inset-0 w-full h-full pointer-events-none p-4 leading-7 whitespace-pre overflow-hidden z-20 font-mono"
            >
                {results.map((res, idx) => (
                    <div key={idx} className="h-7 flex items-center">
                        {/* Mirror Text to push result to the right position */}
                        <span className="invisible opacity-0">{lines[idx]}</span>
                        
                        {/* Result Badge */}
                        {res.value !== null && res.value !== undefined && (
                            <span className="ml-3 inline-flex items-center px-2 rounded bg-emerald-100 dark:bg-[#1f1f1f] text-emerald-700 dark:text-[#52c41a] border border-emerald-200 dark:border-gray-700 text-sm font-bold shadow-sm select-text pointer-events-auto">
                                {res.formatted} 
                                {res.variable && <span className="ml-1 opacity-60 text-xs font-normal">({res.variable})</span>}
                            </span>
                        )}
                    </div>
                ))}
                 {/* Extra space matching textarea */}
                 <div className="h-[50vh]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
