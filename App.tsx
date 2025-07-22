import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import GameInfoPanel from './components/GameInfoPanel';
import MobileControls from './components/MobileControls';
import { GRID_WIDTH, GRID_HEIGHT, COLORS, SHAPES, LEVEL_UP_LINES, LOGICAL_GRID_WIDTH, PARTICLE_SCALE, COMBO_MULTIPLIERS, CHAIN_REACTION_MULTIPLIER_BONUS, SPECIAL_BLOCK_CHANCE, BOMB_PARTICLE, BOMB_RADIUS } from './constants';
import type { Grid, Block, Shape, Position } from './types';

// 로컬 스토리지에 저장할 키 정의
const GAME_SAVE_KEY = 'sand-blast-game-save';

const createEmptyGrid = (): Grid => Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));

const App: React.FC = () => {
    const [grid, setGrid] = useState<Grid>(createEmptyGrid());
    const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
    const [nextBlock, setNextBlock] = useState<Block | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [clearedLines, setClearedLines] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [isGameActive, setIsGameActive] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [clearingParticles, setClearingParticles] = useState<Set<string>>(new Set());
    const [comboMessage, setComboMessage] = useState<string | null>(null);

    const gameLoopRef = useRef<number | null>(null);
    // 마지막 자동저장 시간을 추적하는 ref
    const lastAutoSaveRef = useRef<number>(Date.now());

    const getRandomBlock = useCallback((): Block => {
        if (Math.random() < SPECIAL_BLOCK_CHANCE) {
            // Only bomb blocks are special blocks now
            return {
                shape: [[1, 1], [1, 1]], // O-shape for bombs
                colorIndex: BOMB_PARTICLE,
                position: { row: 0, col: Math.floor((LOGICAL_GRID_WIDTH - 2) / 2) },
            };
        }

        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        const shape = SHAPES[shapeIndex];
        return {
            shape,
            colorIndex,
            position: { row: 0, col: Math.floor((LOGICAL_GRID_WIDTH - shape[0].length) / 2) },
        };
    }, []);

    // 게임 상태를 저장하는 함수
    const saveGameState = useCallback(() => {
        if (!isGameActive || isGameOver) return;
        
        const gameState = {
            grid,
            currentBlock,
            nextBlock,
            score,
            level,
            clearedLines,
            isGameActive,
            isPaused,
            timestamp: Date.now(),
        };

        try {
            localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(gameState));
            console.log('게임 상태가 자동 저장되었습니다.');
            lastAutoSaveRef.current = Date.now();
        } catch (error) {
            console.error('게임 상태 저장 실패:', error);
        }
    }, [grid, currentBlock, nextBlock, score, level, clearedLines, isGameActive, isPaused, isGameOver]);

    // 게임 상태를 로드하는 함수
    const loadGameState = useCallback(() => {
        try {
            const savedState = localStorage.getItem(GAME_SAVE_KEY);
            if (!savedState) return false;
            
            const gameState = JSON.parse(savedState);
            
            // 저장된 데이터가 24시간 이상 지났으면 무시
            if (Date.now() - gameState.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(GAME_SAVE_KEY);
                return false;
            }
            
            setGrid(gameState.grid);
            setCurrentBlock(gameState.currentBlock);
            setNextBlock(gameState.nextBlock);
            setScore(gameState.score);
            setLevel(gameState.level);
            setClearedLines(gameState.clearedLines);
            setIsGameActive(gameState.isGameActive);
            setIsPaused(true); // 로드 후에는 항상 일시정지 상태로 시작
            setIsGameOver(false);
            
            return true;
        } catch (error) {
            console.error('게임 상태 로드 실패:', error);
            return false;
        }
    }, []);

    const startGame = useCallback(() => {
        // 저장된 게임이 있는지 확인하고 로드
        const hasLoadedGame = loadGameState();
        
        if (!hasLoadedGame) {
            setGrid(createEmptyGrid());
            setScore(0);
            setLevel(1);
            setClearedLines(0);
            setIsGameOver(false);
            const newBlock = getRandomBlock();
            setCurrentBlock(newBlock);
            setNextBlock(getRandomBlock());
            setIsGameActive(true);
        }
        
        setIsPaused(false);
        setIsSimulating(false);
        setClearingParticles(new Set());
        setComboMessage(null);
    }, [getRandomBlock, loadGameState]);

    const checkCollision = useCallback((block: Block, gridToCheck: Grid): boolean => {
        for (let y = 0; y < block.shape.length; y++) {
            for (let x = 0; x < block.shape[y].length; x++) {
                if (block.shape[y][x]) {
                    // For each logical cell, check its corresponding particle grid area
                    for (let pY = 0; pY < PARTICLE_SCALE; pY++) {
                        for (let pX = 0; pX < PARTICLE_SCALE; pX++) {
                            const newX = block.position.col * PARTICLE_SCALE + x * PARTICLE_SCALE + pX;
                            const newY = block.position.row * PARTICLE_SCALE + y * PARTICLE_SCALE + pY;

                            if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                                return true; // Out of bounds
                            }
                            if (newY >= 0 && gridToCheck[newY] && gridToCheck[newY][newX] !== null) {
                                return true; // Collides with existing sand
                            }
                        }
                    }
                }
            }
        }
        return false;
    }, []);

    const runAnimatedSandSimulation = useCallback((gridToSimulate: Grid) => {
        return new Promise<Grid>((resolve) => {
            let currentSimGrid = JSON.parse(JSON.stringify(gridToSimulate));
            
            const simulationStep = () => {
                let moved = false;
                let nextSimGrid = JSON.parse(JSON.stringify(currentSimGrid));
    
                for (let r = GRID_HEIGHT - 2; r >= 0; r--) {
                    for (let c = 0; c < GRID_WIDTH; c++) {
                        if (nextSimGrid[r][c] !== null) {
                            if (nextSimGrid[r + 1][c] === null) {
                                nextSimGrid[r + 1][c] = nextSimGrid[r][c];
                                nextSimGrid[r][c] = null;
                                moved = true;
                            } else {
                                const canGoLeft = c > 0 && nextSimGrid[r + 1][c - 1] === null;
                                const canGoRight = c < GRID_WIDTH - 1 && nextSimGrid[r + 1][c + 1] === null;
                                
                                if (canGoLeft && canGoRight) {
                                    if (Math.random() < 0.5) {
                                        nextSimGrid[r + 1][c - 1] = nextSimGrid[r][c];
                                    } else {
                                        nextSimGrid[r + 1][c + 1] = nextSimGrid[r][c];
                                    }
                                    nextSimGrid[r][c] = null;
                                    moved = true;
                                } else if (canGoLeft) {
                                    nextSimGrid[r + 1][c - 1] = nextSimGrid[r][c];
                                    nextSimGrid[r][c] = null;
                                    moved = true;
                                } else if (canGoRight) {
                                    nextSimGrid[r + 1][c + 1] = nextSimGrid[r][c];
                                    nextSimGrid[r][c] = null;
                                    moved = true;
                                }
                            }
                        }
                    }
                }
    
                currentSimGrid = nextSimGrid;
                setGrid(currentSimGrid);
    
                if (moved) {
                    setTimeout(simulationStep, 20);
                } else {
                    resolve(currentSimGrid);
                }
            };
    
            simulationStep();
        });
    }, []);

    const clearLines = useCallback(async (initialGrid: Grid): Promise<{ newGrid: Grid; linesCleared: number; particlesToClear: Set<string> }> => {
        const gridCopy = JSON.parse(JSON.stringify(initialGrid));
        const allParticlesToClear = new Set<string>();
        let linesClearedCount = 0;
        const masterProcessedParticles = new Set<string>();

        for (let r = 0; r < GRID_HEIGHT; r++) {
            const startKey = `${r},0`;
            if (gridCopy[r][0] !== null && gridCopy[r][0] >= 0 && !masterProcessedParticles.has(startKey)) {
                const color = gridCopy[r][0];
                const componentParticles = new Set<string>();
                const q: Position[] = [{ row: r, col: 0 }];
                const visitedInComponent = new Set<string>([startKey]);
                
                while (q.length > 0) {
                    const { row: currR, col: currC } = q.shift()!;
                    componentParticles.add(`${currR},${currC}`);

                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nextR = currR + dr;
                            const nextC = currC + dc;
                            const key = `${nextR},${nextC}`;

                            if (nextR >= 0 && nextR < GRID_HEIGHT && nextC >= 0 && nextC < GRID_WIDTH && !visitedInComponent.has(key)) {
                                const nextCellVal = gridCopy[nextR][nextC];
                                if (nextCellVal === color) {
                                  visitedInComponent.add(key);
                                  q.push({ row: nextR, col: nextC });
                                }
                            }
                        }
                    }
                }

                componentParticles.forEach(p => masterProcessedParticles.add(p));

                let reachesRightWall = false;
                for (const p of componentParticles) {
                    if (parseInt(p.split(',')[1]) === GRID_WIDTH - 1) {
                        reachesRightWall = true;
                        break;
                    }
                }

                if (reachesRightWall) {
                    linesClearedCount++;
                    componentParticles.forEach(p => allParticlesToClear.add(p));
                }
            }
        }
        
        if (allParticlesToClear.size > 0) {
            setClearingParticles(allParticlesToClear);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let newGrid = JSON.parse(JSON.stringify(gridCopy));
            allParticlesToClear.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                newGrid[r][c] = null;
            });
            setClearingParticles(new Set());
            return { newGrid, linesCleared: linesClearedCount, particlesToClear: allParticlesToClear };
        } else {
            return { newGrid: initialGrid, linesCleared: 0, particlesToClear: new Set() };
        }
    }, []);
    
    const handleBombExplosions = useCallback(async (gridWithBombs: Grid): Promise<{ newGrid: Grid; particlesExploded: Set<string>; bombCount: number }> => {
        const bombParticles: Position[] = [];
        gridWithBombs.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell === BOMB_PARTICLE) {
                    bombParticles.push({ row: r, col: c });
                }
            });
        });

        if (bombParticles.length === 0) {
            return { newGrid: gridWithBombs, particlesExploded: new Set(), bombCount: 0 };
        }

        const particlesToExplode = new Set<string>();
        const radiusInParticles = BOMB_RADIUS * PARTICLE_SCALE;

        bombParticles.forEach(bombPos => {
            for (let r = 0; r < GRID_HEIGHT; r++) {
                for (let c = 0; c < GRID_WIDTH; c++) {
                    const distance = Math.sqrt(Math.pow(r - bombPos.row, 2) + Math.pow(c - bombPos.col, 2));
                    if (distance <= radiusInParticles && gridWithBombs[r][c] !== null) {
                        particlesToExplode.add(`${r},${c}`);
                    }
                }
            }
        });
        
        setClearingParticles(particlesToExplode);
        await new Promise(resolve => setTimeout(resolve, 500));

        const newGrid = JSON.parse(JSON.stringify(gridWithBombs));
        particlesToExplode.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            newGrid[r][c] = null;
        });

        setClearingParticles(new Set());
        return { newGrid, particlesExploded: particlesToExplode, bombCount: bombParticles.length };
    }, []);


    const placeBlock = useCallback(async () => {
        if (!currentBlock) return;
    
        setIsSimulating(true);
        const blockPlaced = { ...currentBlock };
        setCurrentBlock(null);
    
        let workingGrid = JSON.parse(JSON.stringify(grid));
        blockPlaced.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    for (let pY = 0; pY < PARTICLE_SCALE; pY++) {
                        for (let pX = 0; pX < PARTICLE_SCALE; pX++) {
                            const gridX = blockPlaced.position.col * PARTICLE_SCALE + x * PARTICLE_SCALE + pX;
                            const gridY = blockPlaced.position.row * PARTICLE_SCALE + y * PARTICLE_SCALE + pY;
                            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                                workingGrid[gridY][gridX] = blockPlaced.colorIndex;
                            }
                        }
                    }
                }
            });
        });
    
        workingGrid = await runAnimatedSandSimulation(workingGrid);
        
        let totalLinesClearedThisTurn = 0;
        let totalScoreFromTurn = 0;

        if (blockPlaced.colorIndex === BOMB_PARTICLE) {
            const { newGrid, particlesExploded, bombCount } = await handleBombExplosions(workingGrid);
            if (particlesExploded.size > 0) {
                const scoreForExplosion = (particlesExploded.size - bombCount) * 5 * level;
                totalScoreFromTurn += scoreForExplosion;
                workingGrid = await runAnimatedSandSimulation(newGrid);
            }
        }
        
        let chainCount = 0;
        while (true) {
            const { newGrid, linesCleared, particlesToClear } = await clearLines(workingGrid);

            if (linesCleared > 0) {
                chainCount++;
                totalLinesClearedThisTurn += linesCleared;

                const comboName = { 1: '', 2: 'Double', 3: 'Triple', 4: 'Quad' }[linesCleared] || `Combo x${linesCleared}`;
                let message = linesCleared > 1 ? `${comboName} Clear!` : '';
                if (chainCount > 1) message = `${message} Chain x${chainCount}!`.trim();
                
                if (message) setComboMessage(message);

                const comboMultiplier = COMBO_MULTIPLIERS[linesCleared] || COMBO_MULTIPLIERS[4];
                const chainMultiplier = 1 + (chainCount - 1) * CHAIN_REACTION_MULTIPLIER_BONUS;
                const scoreForThisClear = particlesToClear.size * 10 * level * comboMultiplier * chainMultiplier;
                totalScoreFromTurn += scoreForThisClear;
                
                workingGrid = await runAnimatedSandSimulation(newGrid);
            } else {
                break;
            }
        }

        setGrid(workingGrid);
        if (totalScoreFromTurn > 0) setScore(prev => prev + Math.round(totalScoreFromTurn));
        if (totalLinesClearedThisTurn > 0) setClearedLines(prev => prev + totalLinesClearedThisTurn);
        
        const newBlock = nextBlock!;
        if (checkCollision(newBlock, workingGrid)) {
            setIsGameOver(true);
            setIsPaused(true);
            setIsGameActive(false);
            // 게임 오버 시 저장된 게임 데이터 삭제
            localStorage.removeItem(GAME_SAVE_KEY);
        } else {
            setCurrentBlock(newBlock);
            setNextBlock(getRandomBlock());
        }
    
        setIsSimulating(false);
    
    }, [currentBlock, grid, nextBlock, checkCollision, getRandomBlock, runAnimatedSandSimulation, clearLines, level, handleBombExplosions]);


    const dropBlock = useCallback(() => {
        if (!currentBlock || isPaused || isGameOver || isSimulating) return;
        
        const newPos = { ...currentBlock.position, row: currentBlock.position.row + 1 };
        const newBlock = { ...currentBlock, position: newPos };

        if (!checkCollision(newBlock, grid)) {
            setCurrentBlock(newBlock);
        } else {
            placeBlock();
        }
    }, [currentBlock, isPaused, isGameOver, isSimulating, grid, checkCollision, placeBlock]);

    useEffect(() => {
        if (isPaused || isGameOver || isSimulating) {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            return;
        }

        const dropSpeed = Math.max(100, 1000 - (level - 1) * 50);
        gameLoopRef.current = window.setInterval(dropBlock, dropSpeed);

        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [dropBlock, isPaused, isGameOver, level, isSimulating]);

    // 자동 저장을 위한 useEffect
    useEffect(() => {
        if (!isGameActive || isPaused || isGameOver) return;

        // 30초마다 게임 상태 저장
        const autoSaveInterval = setInterval(() => {
            saveGameState();
        }, 30000); // 30초마다 저장

        return () => {
            clearInterval(autoSaveInterval);
        };
    }, [isGameActive, isPaused, isGameOver, saveGameState]);

    // 중요한 게임 상태 변화가 있을 때마다 저장
    useEffect(() => {
        // 마지막 저장 후 10초가 지났을 때만 저장 (너무 자주 저장 방지)
        if (isGameActive && !isPaused && !isGameOver && Date.now() - lastAutoSaveRef.current > 10000) {
            saveGameState();
        }
    }, [score, level, clearedLines, isGameActive, isPaused, isGameOver, saveGameState]);

    const moveBlock = useCallback((dx: number) => {
        if (!currentBlock || isPaused || isGameOver || isSimulating) return;
        const newPos = { ...currentBlock.position, col: currentBlock.position.col + dx };
        const newBlock = { ...currentBlock, position: newPos };
        if (!checkCollision(newBlock, grid)) {
            setCurrentBlock(newBlock);
        }
    }, [currentBlock, isPaused, isGameOver, grid, checkCollision, isSimulating]);

    const rotateBlock = useCallback(() => {
        if (!currentBlock || isPaused || isGameOver || isSimulating) return;
        if (currentBlock.colorIndex === BOMB_PARTICLE) return; // Cannot rotate bomb 'O' block
        const shape = currentBlock.shape;
        const rotated = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        const newBlock = { ...currentBlock, shape: rotated };
        if (!checkCollision(newBlock, grid)) {
            setCurrentBlock(newBlock);
        }
    }, [currentBlock, isPaused, isGameOver, grid, checkCollision, isSimulating]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isPaused || isGameOver || isSimulating) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moveBlock(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveBlock(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                dropBlock();
                break;
            case 'ArrowUp':
                e.preventDefault();
                rotateBlock();
                break;
        }
    }, [isPaused, isGameOver, isSimulating, moveBlock, dropBlock, rotateBlock]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        if (clearedLines > 0 && Math.floor((clearedLines - 1) / LEVEL_UP_LINES) + 1 > level) {
            setLevel(prev => Math.floor((clearedLines - 1) / LEVEL_UP_LINES) + 1);
        }
    }, [clearedLines, level]);

    useEffect(() => {
        if (comboMessage) {
            const timer = setTimeout(() => {
                setComboMessage(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [comboMessage]);

    // 로딩 시 저장된 게임 데이터가 있는지 확인
    useEffect(() => {
        loadGameState();
    }, [loadGameState]);

    const handleStartPause = () => {
        if (isGameOver) {
            startGame();
            return;
        }
        if (!isGameActive) {
            startGame();
        } else {
            setIsPaused(prev => !prev);
            // 일시정지할 때 게임 상태 저장
            if (!isPaused) {
                saveGameState();
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-row justify-center items-center gap-2 p-2 bg-slate-900">
            <main>
                <GameBoard 
                    grid={grid} 
                    currentBlock={currentBlock} 
                    isPaused={isPaused}
                    isGameOver={isGameOver}
                    onRestart={handleStartPause}
                    clearingParticles={clearingParticles}
                    score={score}
                    level={level}
                    clearedLines={clearedLines}
                    comboMessage={comboMessage}
                />
            </main>
            <aside>
                <GameInfoPanel 
                    score={score} 
                    level={level} 
                    clearedLines={clearedLines}
                    nextBlock={nextBlock}
                    onStartPause={handleStartPause}
                    isGameActive={isGameActive && !isPaused}
                />
            </aside>
            {isGameActive && !isPaused && (
                 <MobileControls 
                    onMoveLeft={() => moveBlock(-1)}
                    onMoveRight={() => moveBlock(1)}
                    onMoveDown={dropBlock}
                    onRotate={rotateBlock}
                />
            )}
        </div>
    );
};

export default App;