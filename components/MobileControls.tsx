import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon } from './icons';

interface MobileControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveDown: () => void;
  onRotate: () => void;
}

const ControlButton: React.FC<{ onClick: (e: React.MouseEvent | React.TouchEvent) => void; children: React.ReactNode; className?: string; 'aria-label': string }> = ({ onClick, children, className = '', 'aria-label': ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
    onTouchStart={(e) => { e.preventDefault(); onClick(e); }}
    className={`w-20 h-20 bg-slate-700/80 rounded-full flex justify-center items-center text-white active:bg-cyan-500 transition-colors backdrop-blur-sm shadow-lg ${className}`}
  >
    {children}
  </button>
);

const MobileControls: React.FC<MobileControlsProps> = ({ onMoveLeft, onMoveRight, onMoveDown, onRotate }) => {
  return (
    <div className="md:hidden fixed bottom-8 left-0 right-0 flex justify-between items-center z-20 px-4" onContextMenu={(e) => e.preventDefault()}>
      {/* Left/Right controls */}
      <div className="flex gap-4">
        <ControlButton onClick={onMoveLeft} aria-label="Move left">
          <ArrowLeftIcon />
        </ControlButton>
        <ControlButton onClick={onMoveRight} aria-label="Move right">
          <ArrowRightIcon />
        </ControlButton>
      </div>
      
      {/* Rotate/Down controls */}
      <div className="flex gap-4">
        <ControlButton onClick={onRotate} aria-label="Rotate" className="!bg-cyan-600/90">
          <ArrowUpIcon />
        </ControlButton>
        <ControlButton onClick={onMoveDown} aria-label="Move down">
          <ArrowDownIcon />
        </ControlButton>
      </div>
    </div>
  );
};

export default MobileControls;