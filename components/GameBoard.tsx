import React from 'react';
import { GRID_WIDTH, GRID_HEIGHT, COLORS, TAILWIND_COLORS, PARTICLE_SCALE, DANGER_ZONE_LOGICAL_HEIGHT, BOMB_PARTICLE } from '../constants';
import type { Grid, Block } from '../types';

interface GameBoardProps {
  grid: Grid;
  currentBlock: Block | null;
  isPaused: boolean;
  isGameOver: boolean;
  onRestart: () => void;
  clearingParticles: Set<string>;
  score: number;
  level: number;
  clearedLines: number;
  comboMessage: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ grid, currentBlock, isPaused, isGameOver, onRestart, clearingParticles, score, level, clearedLines, comboMessage }) => {
  const dangerZonePixelHeight = DANGER_ZONE_LOGICAL_HEIGHT * PARTICLE_SCALE;

  const renderGrid = () => {
    const displayGrid = JSON.parse(JSON.stringify(grid)) as Grid;

    if (currentBlock) {
      currentBlock.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            // For each logical cell, render its corresponding particle grid area
            for (let pY = 0; pY < PARTICLE_SCALE; pY++) {
              for (let pX = 0; pX < PARTICLE_SCALE; pX++) {
                const gridX = currentBlock.position.col * PARTICLE_SCALE + x * PARTICLE_SCALE + pX;
                const gridY = currentBlock.position.row * PARTICLE_SCALE + y * PARTICLE_SCALE + pY;
                if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                  displayGrid[gridY][gridX] = currentBlock.colorIndex;
                }
              }
            }
          }
        });
      });
    }

    return displayGrid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => {
          const isClearing = clearingParticles.has(`${y},${x}`);
          const isDangerZoneCell = y < dangerZonePixelHeight && cell === null;
          
          let cellColorClass = 'bg-slate-800';
          if(isDangerZoneCell) {
            cellColorClass = 'bg-red-900/40';
          } else if (cell !== null) {
            const colorKey = cell < 0 ? cell.toString() : COLORS[cell];
            cellColorClass = TAILWIND_COLORS[colorKey] ?? 'bg-slate-800';
          }
          
          return (
            <div
              key={`${y}-${x}`}
              className={`w-[5px] h-[5px] md:w-2 md:h-2 border-slate-900/50 border-[0.5px] transition-colors duration-200 ${cellColorClass} ${isClearing ? 'particle-clearing' : ''}`}
            />
          );
        })}
      </div>
    ));
  };

  const Overlay: React.FC<{ title: string; buttonText: string; onButtonClick: () => void; showStats?: boolean }> = ({ title, buttonText, onButtonClick, showStats }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold text-white mb-6 animate-glow">{title}</h2>
        
        {showStats && (
          <div className="bg-slate-800/70 p-4 rounded-lg mb-6 w-60 text-lg shadow-lg border border-slate-700 animate-fall">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-300">최종 점수</span>
              <span className="font-mono text-yellow-400">{score}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-600/50">
              <span className="text-slate-300">도달 레벨</span>
              <span className="font-mono text-yellow-400">{level}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-600/50">
              <span className="text-slate-300">지운 줄</span>
              <span className="font-mono text-yellow-400">{clearedLines}</span>
            </div>
          </div>
        )}

        <button
          onClick={onButtonClick}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-500 transition-transform transform hover:scale-105"
        >
          {buttonText}
        </button>
      </div>
  );

  return (
    <div className="relative bg-slate-800 p-1 md:p-2 rounded-lg shadow-2xl shadow-slate-950/50 border border-slate-700">
      {isGameOver && <Overlay title="게임 오버" buttonText="다시 시작" onButtonClick={onRestart} showStats />}
      {isPaused && !isGameOver && <Overlay title="일시정지" buttonText="계속하기" onButtonClick={onRestart} />}
      {comboMessage && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-20">
          <div className="text-3xl md:text-5xl font-extrabold text-white animate-combo" style={{ textShadow: '0 0 8px #fff, 0 0 15px #FFD700, 0 0 25px #FF8C00' }}>
            {comboMessage}
          </div>
        </div>
      )}
      <div className="flex flex-col">{renderGrid()}</div>
    </div>
  );
};

export default GameBoard;