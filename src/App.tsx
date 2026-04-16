import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Gamepad2, Disc3, RefreshCw, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

        // Wrap around or Wall collision? For neon aesthetic, walls are deadly.
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
    if (audioRef.current) {
      audioRef.current.volume = volume;
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
          className={`w-full h-full transition-all duration-75 flex items-center justify-center ${
            isHead
              ? 'bg-[#00f2ff] shadow-[0_0_12px_#00f2ff] rounded-[2px] z-10 scale-110'
              : isSnake
              ? 'bg-[#00f2ff] shadow-[0_0_10px_#00f2ff] rounded-[2px] scale-95'
              : isFood
              ? 'bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] rounded-full scale-[0.6] min-w-full min-h-full block animate-pulse'
              : 'border border-white/[0.02]'
          }`}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden selection:bg-[#ff00ff] selection:text-white">
      {/* Background Grid Accent & Blobs */}
      <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] opacity-35 bg-[#ff00ff] pointer-events-none fixed z-0" />
      <div className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] opacity-35 bg-[#00f2ff] pointer-events-none fixed z-0" />
      <div className="absolute inset-0 z-0 bg-transparent pointer-events-none fixed" />

      {/* Main Container */}
      <div className="z-10 w-full max-w-5xl flex flex-col md:flex-row gap-8 p-4 xl:p-0 my-8 items-start justify-center">
        
        {/* Left Panel: Music Player */}
        <div className="w-full md:w-80 bg-[rgba(255,255,255,0.03)] backdrop-blur-[25px] border border-[rgba(255,255,255,0.1)] p-6 rounded-[20px] flex flex-col shrink-0">
          <div className="flex items-center space-x-3 mb-6">
            <motion.div 
               animate={{ rotate: isPlaying ? 360 : 0 }} 
               transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
               className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2ff] to-[#ff00ff] flex items-center justify-center"
            >
              <Disc3 className="w-5 h-5 text-white" />
            </motion.div>
            <h2 className="text-lg font-extrabold tracking-tight text-white uppercase">Neon Rhythm</h2>
          </div>

          <div className="bg-[rgba(255,255,255,0.07)] border border-[rgba(0,242,255,0.3)] p-4 rounded-xl mb-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff]/50 to-transparent" />
            <p className="text-[10px] text-[#8e9297] mb-1 uppercase tracking-widest font-bold">Now Playing</p>
            <p className="text-sm text-white font-bold truncate">
              {TRACKS[currentTrackIndex].title}
            </p>
            {/* Visualizer bars mock */}
            <div className="flex items-end h-8 space-x-1 mt-4">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { height: ['20%', '100%', '30%', '80%', '20%'] } : { height: '20%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8 + Math.random(), 
                    times: [0, 0.2, 0.5, 0.8, 1],
                    ease: "easeInOut" 
                  }}
                  className="w-full bg-[#00f2ff]/80 rounded-t-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button onClick={prevTrack} className="w-10 h-10 rounded-full transition text-[#00f2ff] opacity-70 hover:opacity-100 hover:drop-shadow-[0_0_10px_#00f2ff] flex items-center justify-center cursor-pointer border-none bg-transparent">
              <SkipBack className="w-6 h-6" />
            </button>
            <button onClick={togglePlay} className="w-16 h-16 bg-[rgba(0,242,255,0.05)] border-2 border-[#00f2ff] text-[#00f2ff] rounded-full transition hover:scale-105 cursor-pointer flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)]">
              {isPlaying ? <Pause className="w-8 h-8 fill-current drop-shadow-[0_0_8px_#00f2ff]" /> : <Play className="w-8 h-8 fill-current ml-1 drop-shadow-[0_0_8px_#00f2ff]" />}
            </button>
            <button onClick={nextTrack} className="w-10 h-10 rounded-full transition text-[#00f2ff] opacity-70 hover:opacity-100 hover:drop-shadow-[0_0_10px_#00f2ff] flex items-center justify-center cursor-pointer border-none bg-transparent">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[#8e9297]">
            <Volume2 className="w-5 h-5 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-white h-1 bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
            />
          </div>

          <audio 
             ref={audioRef} 
             src={TRACKS[currentTrackIndex].url}
             onEnded={nextTrack}
          />

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)] text-xs text-[#8e9297] space-y-2">
            <p className="flex justify-between"><span>SYS:</span> <span className="text-white/[0.8]">ONLINE</span></p>
            <p className="flex justify-between"><span>AI_MUSIC:</span> <span className="text-[#00f2ff] font-bold shadow-[#00f2ff]">GENERATING</span></p>
          </div>
        </div>

        {/* Right Panel: Game Board */}
        <div className="flex-1 w-full max-w-xl bg-[rgba(255,255,255,0.03)] backdrop-blur-[25px] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold tracking-tight text-white">Cyber Snake</h1>
            </div>
            <div className="flex items-center space-x-8 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-[#8e9297] text-[10px] uppercase tracking-widest mb-1">Score</span>
                <span 
                  className="text-4xl md:text-5xl font-bold font-digital text-[#00f2ff] leading-none glitch-text drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]"
                  data-text={score.toString().padStart(4, '0')}
                >
                  {score.toString().padStart(4, '0')}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#8e9297] text-[10px] uppercase tracking-widest mb-1">Best</span>
                <span 
                  className="text-3xl md:text-4xl font-bold font-digital text-[#ff00ff] leading-none glitch-text drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]"
                  data-text={highScore.toString().padStart(4, '0')}
                >
                  {highScore.toString().padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-[500px] mx-auto bg-black/30 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05),transparent)] border border-white/10 rounded-xl overflow-hidden box-content flex items-center justify-center shadow-lg">
            {/* Game Grid */}
            <div 
               className="absolute inset-0 grid" 
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
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20"
                >
                  <Power className="w-16 h-16 text-[#00f2ff] mb-6 opacity-80 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
                  <button 
                    onClick={resetGame}
                    className="cursor-pointer px-8 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,242,255,0.5)] rounded-full text-white hover:bg-[#00f2ff] hover:text-[#08080c] hover:border-[#00f2ff] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)]"
                  >
                    Insert Coin
                  </button>
                  <p className="mt-4 text-xs text-[#8e9297]">Use Arrow Keys to Move</p>
                </motion.div>
              )}

              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md z-20 border border-red-500/50 shadow-[inset_0_0_50px_rgba(255,0,0,0.2)]"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 uppercase tracking-[0.2em] animate-pulse drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] text-center">System Failure</h2>
                  <p className="mb-8 text-white/80 font-mono">Final Score: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="cursor-pointer flex items-center space-x-2 px-6 py-3 bg-[rgba(255,255,255,0.05)] border border-red-500 rounded-full text-white hover:bg-white hover:text-red-900 hover:border-white uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reboot</span>
                  </button>
                </motion.div>
              )}

              {isPaused && !gameOver && gameStarted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md z-20"
                >
                  <div className="text-2xl font-bold text-[#00f2ff] uppercase tracking-[0.3em] drop-shadow-[0_0_10px_#00f2ff]">Paused</div>
                  <p className="mt-2 text-xs text-[#8e9297]">Press SPACE to resume</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Controls mapping */}
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mt-6 md:hidden pb-4">
             <div />
             <button aria-label="Up" className="h-12 bg-white/5 border border-white/10 rounded-lg active:bg-white/10 focus:bg-white/10 transition-colors flex items-center justify-center text-white/50 active:text-white shadow-lg backdrop-blur-sm" onClick={() => { if(dirRef.current.y === 0) setDirection({x:0, y:-1})}}>▲</button>
             <div />
             <button aria-label="Left" className="h-12 bg-white/5 border border-white/10 rounded-lg active:bg-white/10 focus:bg-white/10 transition-colors flex items-center justify-center text-white/50 active:text-white shadow-lg backdrop-blur-sm" onClick={() => { if(dirRef.current.x === 0) setDirection({x:-1, y:0})}}>◀</button>
             <button aria-label="Down" className="h-12 bg-white/5 border border-white/10 rounded-lg active:bg-white/10 focus:bg-white/10 transition-colors flex items-center justify-center text-white/50 active:text-white shadow-lg backdrop-blur-sm" onClick={() => { if(dirRef.current.y === 0) setDirection({x:0, y:1})}}>▼</button>
             <button aria-label="Right" className="h-12 bg-white/5 border border-white/10 rounded-lg active:bg-white/10 focus:bg-white/10 transition-colors flex items-center justify-center text-white/50 active:text-white shadow-lg backdrop-blur-sm" onClick={() => { if(dirRef.current.x === 0) setDirection({x:1, y:0})}}>▶</button>
          </div>
        </div>

      </div>
    </div>
  );
}
