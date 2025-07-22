import React from 'react';
import type { Block } from '../types';
import { COLORS, TAILWIND_COLORS, BOMB_PARTICLE } from '../constants';
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon } from './icons';

interface GameInfoPanelProps {
  score: number;
  level: number;
  clearedLines: number;
  nextBlock: Block | null;
  onStartPause: () => void;
  isGameActive: boolean;
}

const NextBlockPreview: React.FC<{ block: Block | null }> = ({ block }) => {
  return (
    <div className="p-2 bg-slate-800 rounded-lg flex justify-center items-center min-h-[64px]">
      {block && block.colorIndex === BOMB_PARTICLE ? (
        <span className="text-4xl animate-pulse" role="img" aria-label="Bomb block">💣</span>
      ) : (
        <div>
          {(() => {
            const previewGrid = Array(4).fill(0).map(() => Array(4).fill(null));
            if (block) {
              const shape = block.shape;
              const yOffset = Math.floor((4 - shape.length) / 2);
              const xOffset = Math.floor((4 - shape[0].length) / 2);

              shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                  if (cell) {
                    previewGrid[y + yOffset][x + xOffset] = block.colorIndex;
                  }
                });
              });
            }
            return previewGrid.map((row, y) => (
              <div key={y} className="flex justify-center">
                {row.map((cell, x) => {
                  const color = cell !== null ? COLORS[cell] : null;
                  const tailwindColor = color ? TAILWIND_COLORS[color] : 'bg-slate-800/50';
                  return <div key={`${y}-${x}`} className={`w-3 h-3 ${tailwindColor}`} />;
                })}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ score, level, clearedLines, nextBlock, onStartPause, isGameActive }) => {
  return (
    <div className="w-32 flex flex-col gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
      <h2 className="text-lg font-bold text-center text-cyan-400">Sand Blast</h2>

      <div className="space-y-1 text-sm p-2 bg-slate-900/70 rounded-md">
        <div className="flex justify-between"><span>점수:</span> <span className="font-mono text-yellow-400">{score}</span></div>
        <div className="flex justify-between"><span>레벨:</span> <span className="font-mono text-yellow-400">{level}</span></div>
        <div className="flex justify-between"><span>지운 줄:</span> <span className="font-mono text-yellow-400">{clearedLines}</span></div>
      </div>
      
      <div className="space-y-1 mt-2">
        <h3 className="text-base font-semibold text-center">다음 블록</h3>
        <NextBlockPreview block={nextBlock} />
      </div>

      <button
        onClick={onStartPause}
        className="w-full py-2 text-sm bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-500 transition-transform transform hover:scale-105"
      >
        {isGameActive ? '일시정지' : '시작'}
      </button>

      <div className="space-y-1 pt-2 border-t border-slate-700">
        <h3 className="text-base font-semibold text-center">조작법</h3>
        <div className="flex flex-col gap-1 text-xs text-slate-400">
          <div className="flex items-center gap-2"><ArrowLeftIcon className="w-4 h-4" /><span>왼쪽</span></div>
          <div className="flex items-center gap-2"><ArrowRightIcon className="w-4 h-4" /><span>오른쪽</span></div>
          <div className="flex items-center gap-2"><ArrowDownIcon className="w-4 h-4" /><span>아래로</span></div>
          <div className="flex items-center gap-2"><ArrowUpIcon className="w-4 h-4" /><span>↑ 회전</span></div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-slate-500">
        <p>자동저장 기능 활성화됨</p>
      </div>
    </div>
  );
};

export default GameInfoPanel;