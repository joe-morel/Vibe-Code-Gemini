import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Gamepad2, Disc3, RefreshCw, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

// AI generated tracks from SoundHelix
const TRACKS = [
  { id: 1, title: 'Neural Beats .mod', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cyber Pulse .exe', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Synth Space .bin', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const dirRef = useRef(direction);

  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  const spawnFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const collision = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood(spawnFood(INITIAL_SNAKE));
    setIsPaused(false);
    setGameStarted(true);
  }, [spawnFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver) return;

      const currentDir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
          if (currentDir.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (currentDir.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (currentDir.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (currentDir.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ': // spacebar for pause
          setIsPaused(p => !p);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Food logic
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, 120);
    return () => clearInterval(intervalId);
  }, [food, gameOver, isPaused, gameStarted, spawnFood]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  // Audio Effects
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current && typeof volume === 'number' && Number.isFinite(volume)) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  // Generate board
  const boardCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isSnake = snake.some(s => s.x === x && s.y === y);
      const isHead = snake[0].x === x && snake[0].y === y;
      const isFood = food.x === x && food.y === y;

      boardCells.push(
        <div
          key={`${x}-${y}`}
          className={`w-full h-full flex justify-center items-center rounded-sm transition-all duration-75 ${
            isHead
              ? 'bg-primary z-10 scale-105'
              : isSnake
              ? 'bg-primary/80'
              : isFood
              ? 'bg-destructive rounded-full scale-75 animate-pulse'
              : 'border border-border/40'
          }`}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6">
        
        {/* Left Panel: Music Player */}
        <Card className="w-full md:w-80 shrink-0 flex flex-col shadow-lg border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <motion.div 
                 animate={{ rotate: isPlaying ? 360 : 0 }} 
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              >
                <Disc3 className="w-5 h-5 text-primary" />
              </motion.div>
              Music Player
            </CardTitle>
            <CardDescription className="uppercase tracking-widest text-xs mt-2 font-medium">
              Now Playing
            </CardDescription>
            <p className="font-semibold text-lg truncate mb-2">
              {TRACKS[currentTrackIndex].title}
            </p>
            
            {/* Visualizer Album Art Placeholder */}
            <div className="w-full aspect-square bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg mt-2 shadow-inner flex items-center justify-center relative overflow-hidden">
              {isPlaying ? (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                       key={i}
                       animate={{ height: ['20%', '80%', '20%'] }}
                       transition={{ repeat: Infinity, duration: 0.6 + Math.random(), ease: "easeInOut" }}
                       className="w-2.5 bg-white/90 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                   <Disc3 className="w-8 h-8 text-white opacity-80 mix-blend-overlay" />
                </div>
              )}
            </div>

          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-start gap-6 py-2">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={prevTrack} className="rounded-full">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={togglePlay} className="h-16 w-16 rounded-full shadow-md">
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
              <Button variant="outline" size="icon" onClick={nextTrack} className="rounded-full">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 w-full max-w-xs px-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[typeof volume === 'number' && Number.isFinite(volume) ? volume : 0.5]}
                max={1}
                step={0.01}
                onValueChange={(val) => {
                  if (val && val.length > 0 && typeof val[0] === 'number') {
                    setVolume(val[0]);
                  }
                }}
                className="w-full cursor-pointer"
              />
            </div>
            
            {/* Up Next Tracks Reference Block */}
            <div className="w-full mt-2 pt-6 border-t border-border/60">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Up Next</h4>
              <div className="flex flex-col gap-1 w-full">
                {TRACKS.map((track, idx) => (
                  <button 
                    key={track.id} 
                    onClick={() => setCurrentTrackIndex(idx)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md transition-colors ${idx === currentTrackIndex ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <span className="text-[10px] font-mono opacity-50 w-4">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-sm truncate flex-1">{track.title}</span>
                    {idx === currentTrackIndex && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

          </CardContent>

          <audio 
             ref={audioRef} 
             src={TRACKS[currentTrackIndex].url}
             onEnded={nextTrack}
          />
        </Card>

        {/* Right Panel: Game Board */}
        <Card className="flex-1 w-full flex flex-col min-h-[500px] shadow-lg border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/60">
            <CardTitle className="text-xl flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" /> Snake
            </CardTitle>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Score</span>
                <motion.span 
                  key={score}
                  initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-3xl font-black font-mono tracking-tighter tabular-nums leading-none"
                >
                  {score.toString().padStart(4, '0')}
                </motion.span>
              </div>
              <div className="flex flex-col items-end opacity-60">
                <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Best</span>
                <span className="text-2xl font-bold font-mono tracking-tighter tabular-nums leading-none">
                   {highScore.toString().padStart(4, '0')}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-6 flex flex-col items-center justify-center relative">
            <div className="relative aspect-square w-full max-w-[450px] bg-muted/30 border rounded-md overflow-hidden box-content flex items-center justify-center">
              {/* Game Grid */}
              <div 
                 className="absolute inset-0 grid bg-card" 
                 style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {boardCells}
              </div>

              {/* Overlays */}
              <AnimatePresence>
                {!gameStarted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px] z-20"
                  >
                    <Power className="w-12 h-12 text-muted-foreground mb-4" />
                    <Button onClick={resetGame} size="lg" className="font-bold uppercase tracking-wider">
                      Start Game
                    </Button>
                    <p className="mt-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Use Arrow Keys</p>
                  </motion.div>
                )}

                {gameOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-destructive z-20"
                  >
                    <h2 className="text-4xl font-black text-destructive-foreground tracking-tight mb-2 uppercase">Game Over</h2>
                    <p className="mb-6 font-bold text-destructive-foreground/90 text-lg">Final Score: {score}</p>
                    <Button onClick={resetGame} variant="secondary" size="lg" className="gap-2 font-bold shadow-xl hover:scale-105 transition-transform">
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </Button>
                  </motion.div>
                )}

                {isPaused && !gameOver && gameStarted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20"
                  >
                    <div className="text-2xl font-bold tracking-widest uppercase mb-2">Paused</div>
                    <p className="text-sm text-muted-foreground">Press SPACE to resume</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Controls mapping */}
            <div className="grid grid-cols-3 gap-2 w-[180px] mx-auto mt-6 md:hidden">
               <div />
               <Button variant="secondary" className="h-14 font-lg" onClick={() => { if(dirRef.current.y === 0) setDirection({x:0, y:-1})}}>▲</Button>
               <div />
               <Button variant="secondary" className="h-14 font-lg" onClick={() => { if(dirRef.current.x === 0) setDirection({x:-1, y:0})}}>◀</Button>
               <Button variant="secondary" className="h-14 font-lg" onClick={() => { if(dirRef.current.y === 0) setDirection({x:0, y:1})}}>▼</Button>
               <Button variant="secondary" className="h-14 font-lg" onClick={() => { if(dirRef.current.x === 0) setDirection({x:1, y:0})}}>▶</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
