import React, { useRef, useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
/**
 * Main App renders the Angry Birds-style game directly on the landing.
 */
export default function App() {
  // 'theme' is preserved for light/dark switch but the game always uses light-cartoon palette
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
  // Game state
  const [levelIndex, setLevelIndex] = useState(0);
  const [levels, setLevels] = useState(levelsPreset);
  const [resetCount, setResetCount] = useState(0);
  const [score, setScore] = useState(0);
  const [showLevelCleared, setShowLevelCleared] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  // Sounds refs
  const slingSound = useRef();
  const popSound = useRef();
  const pigSound = useRef();
  const winSound = useRef();
  const failSound = useRef();

  // Preload sound effects (simple .wav base64)
  useEffect(() => {
    // Only load once
    slingSound.current = new window.Audio(slingshot_wav); // slingshot
    popSound.current = new window.Audio(pop_wav); // pop block/pig
    pigSound.current = new window.Audio(oink_wav);
    winSound.current = new window.Audio(win_wav);
    failSound.current = new window.Audio(fail_wav);
    setSoundsLoaded(true);
  }, []);

  // Score tracking per level
  function handleLevelScore(delta) {
    setScore(s => s + delta);
  }
  // Level complete/fail logic
  function handleLevelCleared() {
    setShowLevelCleared(true);
    winSound.current && winSound.current.play();
    setTimeout(() => {
      setShowLevelCleared(false);
      if (levelIndex < levels.length - 1) setLevelIndex(lvl => lvl + 1);
    }, 1600);
  }
  function handleLevelFailed() {
    setShowFailed(true);
    failSound.current && failSound.current.play();
    setTimeout(() => setShowFailed(false), 1100);
  }
  // Reset level
  function handleRestart() {
    setResetCount(r => r + 1);
  }
  // Next level
  function handleNextLevel() {
    setLevelIndex(lvl => Math.min(lvl + 1, levels.length - 1));
    setShowLevelCleared(false);
  }
  // Previous level
  function handlePrevLevel() {
    setLevelIndex(lvl => Math.max(lvl - 1, 0));
    setShowLevelCleared(false);
  }

  // Theme toggle placeholder (light only for cartoon feel)
  const toggleTheme = () => null;

  return (
    <div className="App" style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Top score bar */}
      <div
        style={{
          width: '100vw',
          background: 'var(--bg-secondary, #eaf4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 12vw 12px 12vw',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 2px 6px 0 rgba(34,50,80,0.06)',
        }}
      >
        <span
          style={{
            color: colors.primary,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 2,
            textShadow: '1px 2px 0 #fff6',
          }}
        >🐦 Angry Birds Slingshot</span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 19,
            color: colors.secondary,
            textShadow: '0px 0px 3px #fff8',
          }}
        >
          Score: <span style={{ color: colors.accent }}>{score}</span>
        </span>
        <span
          style={{
            color: colors.secondary,
            fontSize: 17,
            letterSpacing: '1px',
          }}
        >
          Level {levelIndex + 1}
        </span>
      </div>
      {/* Game area center */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '80vh',
        minWidth: '100vw',
        paddingTop: 18,
        background: 'var(--bg-primary, #fff)',
      }}>
        {/* Show level/fail overlays */}
        {showLevelCleared && (
          <div className="level-message" style={overlayStyle}>
            🎉 <b>Level Cleared!</b>
          </div>
        )}
        {showFailed && (
          <div className="level-message" style={overlayStyle}>
            💧 <b>Try Again</b>
          </div>
        )}
        <div className="game-container" style={gameContainerStyle}>
          <AngryBirdsGame
            key={levelIndex + '-' + resetCount}
            level={levels[levelIndex]}
            onScore={handleLevelScore}
            onCleared={handleLevelCleared}
            onFailed={handleLevelFailed}
            sounds={{
              sling: () => { if (soundsLoaded) slingSound.current.currentTime=0; if (soundsLoaded) slingSound.current.play(); },
              pop: () => { if (soundsLoaded) popSound.current.currentTime=0; if (soundsLoaded) popSound.current.play(); },
              pig: () => { if (soundsLoaded) pigSound.current.currentTime=0; if (soundsLoaded) pigSound.current.play(); },
            }}
            colors={colors}
          />
        </div>
        {/* Controls panel */}
        <div style={{
          marginTop: 18, display: 'flex', flexDirection: 'row', gap: 19,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <button className="ab-toolbar-btn" onClick={handlePrevLevel} disabled={levelIndex === 0}>
            ⬅️ Prev
          </button>
          <button className="ab-toolbar-btn" onClick={handleRestart}>
            🔄 Restart
          </button>
          <button className="ab-toolbar-btn" onClick={handleNextLevel} disabled={levelIndex === levels.length - 1}>
            Next ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Game core ------------------------------------------------------------

// PUBLIC_INTERFACE
/**
 * AngryBirdsGame is the main game engine for 2D physics Angry Birds gameplay.
 *
 * @param {Object} props - Game props
 * @param {Object} props.level - Current level definition
 * @param {Function} props.onScore - Function to update score
 * @param {Function} props.onCleared - Function called when level cleared
 * @param {Function} props.onFailed - Function called on fail
 * @param {Object} props.sounds - Object with sling, pop, pig sound callbacks
 * @param {Object} props.colors - Color palette
 */
function AngryBirdsGame({
  level,
  onScore,
  onCleared,
  onFailed,
  sounds,
  colors
}) {
  // Defensive: If no level or birds, use safe defaults
  const safeLevel = level && typeof level === "object" && typeof level.birds === "object" ? level : {
    birds: [{}], pigs: [], blocks: []
  };

  // Game constants
  const canvasWidth = 420;
  const canvasHeight = 260;
  // Bird/objects size
  const BIRD_RADIUS = 18;
  const PIG_RADIUS = 16;
  const BLOCK_W = 38; // width of block
  const BLOCK_H = 18; // height of block
  const GRAVITY = 0.44;
  const FRICTION = 0.995;
  const SLING_ANCHOR = { x: 60, y: 174 };

  // Game state
  const [entities, setEntities] = useState(() => initEntities(safeLevel));
  const [birdsLeft, setBirdsLeft] = useState(safeLevel.birds.length);
  const [drag, setDrag] = useState({ isAiming: false, sx: 0, sy: 0, dx: 0, dy: 0 });
  const [flying, setFlying] = useState(false);         // if a bird is in the air
  const [currentBirdIdx, setCurrentBirdIdx] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing | cleared | failed

  // Game canvas ref
  const canvasRef = useRef(null);
  // For animation
  const animRef = useRef();

  // Reset game entities when new level/ restart
  useEffect(() => {
    const actualLevel = level && typeof level === "object" && typeof level.birds === "object" ? level : { birds: [{}], pigs: [], blocks: [] };
    setEntities(initEntities(actualLevel));
    setBirdsLeft(actualLevel.birds.length);
    setFlying(false);
    setGameState('playing');
    setCurrentBirdIdx(0);
    setDrag({ isAiming: false, sx: 0, sy: 0, dx: 0, dy: 0 });
  }, [level]);

  // Main animation/game loop
  useEffect(() => {
    let animationId;
    function animate() {
      updatePhysics();
      draw();
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line
  }, [entities, drag, flying, gameState, currentBirdIdx]);

  // Expose draw and updatePhysics as helpers
  function draw() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Sky background
    ctx.fillStyle = 'rgba(185,222,255,1)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Ground
    ctx.fillStyle = 'rgba(76,175,80,0.18)';
    ctx.fillRect(0, canvasHeight - 28, canvasWidth, 28);

    // Platform
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(40, canvasHeight - 32, 54, 8);

    // Slingshot rubber
    if (drag.isAiming && !flying) {
      ctx.strokeStyle = '#ac6518';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(SLING_ANCHOR.x, SLING_ANCHOR.y);
      ctx.lineTo(drag.dx, drag.dy);
      ctx.stroke();
    }

    // Draw blocks
    entities.blocks.forEach(block => {
      if (!block.active) return;
      ctx.save();
      ctx.translate(block.x + BLOCK_W/2, block.y + BLOCK_H/2);
      ctx.rotate(block.rotation || 0);
      ctx.fillStyle = '#deb887';
      ctx.strokeStyle = '#a38a6e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-BLOCK_W/2, -BLOCK_H/2, BLOCK_W, BLOCK_H, 5);
      ctx.fill();
      ctx.stroke();
      // Cartoon nail dots
      ctx.beginPath();
      ctx.fillStyle = '#a38a6e';
      ctx.arc(-BLOCK_W/3, 0, 2.7, 0, 2 * Math.PI);
      ctx.arc(BLOCK_W/3, 0, 2.8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // Draw pigs
    entities.pigs.forEach(pig => {
      if (!pig.active) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pig.x, pig.y, PIG_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = colors.secondary;
      ctx.fill();
      ctx.strokeStyle = '#257d27';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Eyes
      ctx.beginPath();
      ctx.arc(pig.x - 5, pig.y - 3, 2.4, 0, 2 * Math.PI);
      ctx.arc(pig.x + 5, pig.y - 3, 2.7, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(pig.x - 4.3, pig.y - 3, 0.8, 0, 2 * Math.PI);
      ctx.arc(pig.x + 5.0, pig.y - 3, 0.9, 0, 2 * Math.PI);
      ctx.fill();
      // Nostrils
      ctx.fillStyle = '#257d27';
      ctx.beginPath();
      ctx.arc(pig.x - 3, pig.y + 5, 1.2, 0, 2 * Math.PI);
      ctx.arc(pig.x + 3, pig.y + 5, 1.3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // Draw all launched birds (if any)
    entities.birds.forEach((bird, idx) => {
      if (!bird.active) return;
      drawBird(ctx, bird, idx === currentBirdIdx && (flying || drag.isAiming));
    });

    // If bird not yet launched, draw on slingshot
    if (!flying && entities.birds[currentBirdIdx] && entities.birds[currentBirdIdx].active) {
      drawBird(ctx,
        {
          ...entities.birds[currentBirdIdx],
          x: drag.isAiming ? drag.dx : SLING_ANCHOR.x,
          y: drag.isAiming ? drag.dy : SLING_ANCHOR.y,
        },
        true
      );
    }

    // Slingshot stand
    ctx.save();
    // simple cartoon posts
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#c77e18';
    ctx.beginPath();
    ctx.moveTo(SLING_ANCHOR.x - 7, SLING_ANCHOR.y + 24);
    ctx.lineTo(SLING_ANCHOR.x - 7, SLING_ANCHOR.y - 18);
    ctx.moveTo(SLING_ANCHOR.x + 7, SLING_ANCHOR.y + 24);
    ctx.lineTo(SLING_ANCHOR.x + 7, SLING_ANCHOR.y - 13);
    ctx.stroke();
    ctx.restore();

    // Controls (draw next bird as preview)
    // -- handled in UI below --
  }

  function drawBird(ctx, bird, highlight) {
    // Cartoon bird: colored circle with eyes/beak/tail
    ctx.save();
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, BIRD_RADIUS, 0, Math.PI*2);
    ctx.fillStyle = colors.accent;
    ctx.shadowColor = '#ffc10744';
    ctx.shadowBlur = highlight ? 18 : 4;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.primary;
    ctx.globalAlpha = highlight ? 1 : 0.85;
    ctx.stroke();

    // Eyes
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(bird.x - 5, bird.y - 5, 3, 0, 2 * Math.PI);
    ctx.arc(bird.x + 4.3, bird.y - 5, 3.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Pupils
    ctx.beginPath();
    ctx.arc(bird.x - 5.2, bird.y - 4.9, 1, 0, 2 * Math.PI);
    ctx.arc(bird.x + 4, bird.y - 4.9, 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
    // Beak
    ctx.beginPath();
    ctx.moveTo(bird.x, bird.y + 1);
    ctx.lineTo(bird.x + 0, bird.y + 8);
    ctx.lineTo(bird.x - 5, bird.y + 4);
    ctx.closePath();
    ctx.fillStyle = '#ff9800';
    ctx.fill();
    // Tail
    ctx.save();
    ctx.strokeStyle = '#555';
    ctx.translate(bird.x - BIRD_RADIUS +2, bird.y + 7);
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -7);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // Physics simulation and collision
  function updatePhysics() {
    let newEntities = { ...entities };
    let birdsArr = Array.isArray(newEntities.birds) ? [...newEntities.birds] : [];
    let pigsArr = Array.isArray(newEntities.pigs) ? [...newEntities.pigs] : [];
    let blocksArr = Array.isArray(newEntities.blocks) ? [...newEntities.blocks] : [];

    // Only update if bird in flight
    if (flying && birdsArr[currentBirdIdx] && birdsArr[currentBirdIdx].active) {
      let bird = { ...birdsArr[currentBirdIdx] };

      // Physics: v += a, x += v
      bird.vx *= FRICTION;
      bird.vy += GRAVITY;
      bird.x += bird.vx;
      bird.y += bird.vy;

      // Screen bounds
      if (bird.x < 0)   { bird.x = 0; bird.vx *= -0.6; }
      if (bird.x > canvasWidth) { bird.x = canvasWidth; bird.vx *= -0.6; }
      // Hit ground
      if (bird.y + BIRD_RADIUS > canvasHeight - 25) {
        bird.y = canvasHeight - 25 - BIRD_RADIUS;
        if (Math.abs(bird.vy) > 2) {
          bird.vy *= -0.45;
          bird.vx *= 0.7;
        } else {
          bird.vy = 0;
          bird.vx = 0;
          bird.resting = true;
        }
      }

      // COLLISIONS: Pig
      pigsArr = pigsArr.map(pig => {
        if (!pig.active) return pig;
        const dx = pig.x - bird.x;
        const dy = pig.y - bird.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PIG_RADIUS + BIRD_RADIUS) {
          if (pig.active) {
            sounds.pig && sounds.pig();
            onScore?.(100);
          }
          return { ...pig, active: false };
        }
        return pig;
      });

      // COLLISIONS: Block
      blocksArr = blocksArr.map(block => {
        if (!block.active) return block;
        const cx = Math.max(block.x, Math.min(bird.x, block.x + BLOCK_W));
        const cy = Math.max(block.y, Math.min(bird.y, block.y + BLOCK_H));
        const dist = Math.sqrt(Math.pow(bird.x - cx, 2) + Math.pow(bird.y - cy, 2));
        if (dist < BIRD_RADIUS) {
          if (block.active) {
            sounds.pop && sounds.pop();
            onScore?.(40);
          }
          // bounce the bird
          bird.vx *= -0.63;
          bird.vy *= -0.5;
          return { ...block, active: false };
        }
        return block;
      });

      // If bird stopped and not colliding or still high velocity, considered landed
      if (bird.resting || Math.abs(bird.vx) + Math.abs(bird.vy) < 0.7 && bird.y + BIRD_RADIUS >= canvasHeight - 25) {
        // Proceed to next bird or fail
        birdsArr[currentBirdIdx] = { ...bird, resting: true, active: false };
        setTimeout(() => {
          let pigsLeft = pigsArr.filter(p => p.active).length;
          if (pigsLeft === 0) {
            setGameState('cleared');
            onCleared?.();
          } else if (currentBirdIdx+1 >= birdsArr.length) {
            setGameState('failed');
            onFailed?.();
          } else {
            setCurrentBirdIdx(idx => idx + 1);
            setFlying(false);
          }
        }, 650);
      } else {
        birdsArr[currentBirdIdx] = bird;
        setEntities({ ...newEntities, birds: birdsArr, pigs: pigsArr, blocks: blocksArr });
      }
    } else {
      setEntities({ ...newEntities, birds: birdsArr, pigs: pigsArr, blocks: blocksArr });
    }
  }

  // -- Mouse/touch slingshot controls --
  // Drag handling: on mouse/touch drag on slingshot, launch on release
  function onPointerDown(e) {
    if (flying || gameState !== 'playing') return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    let py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // Only if start near slingshot
    if (Math.abs(px - SLING_ANCHOR.x) < 42 && Math.abs(py - SLING_ANCHOR.y) < 38) {
      setDrag({ isAiming: true, sx: px, sy: py, dx: px, dy: py });
    }
  }
  function onPointerMove(e) {
    if (!drag.isAiming || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    let py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // Clamp distance/max pullback
    let dx = px - SLING_ANCHOR.x;
    let dy = py - SLING_ANCHOR.y;
    const maxPull = 66;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxPull) {
      // Clamp to max circle
      dx = (dx / dist) * maxPull;
      dy = (dy / dist) * maxPull;
    }
    setDrag({ ...drag, dx: SLING_ANCHOR.x + dx, dy: SLING_ANCHOR.y + dy });
  }
  function onPointerUp(e) {
    if (!drag.isAiming) return;
    // Calculate velocity based on pull vector
    let dx = drag.dx - SLING_ANCHOR.x;
    let dy = drag.dy - SLING_ANCHOR.y;
    // Negative because drag "back"
    let vx = -dx * 0.19; // tuning
    let vy = -dy * 0.21;

    // Launch the bird if not already flying and bird available
    if (!flying && entities.birds[currentBirdIdx] && entities.birds[currentBirdIdx].active && (Math.abs(vx) + Math.abs(vy) > 3.5)) {
      let birdsArr = [...entities.birds];
      birdsArr[currentBirdIdx] = {
        ...birdsArr[currentBirdIdx],
        x: SLING_ANCHOR.x,
        y: SLING_ANCHOR.y,
        vx,
        vy,
        active: true,
        resting: false,
      };
      setEntities({ ...entities, birds: birdsArr });
      setDrag({ isAiming: false, sx: 0, sy: 0, dx: 0, dy: 0 });
      setFlying(true);
      sounds.sling && sounds.sling();
    } else {
      setDrag({ isAiming: false, sx: 0, sy: 0, dx: 0, dy: 0 });
    }
  }

  // -- Main render (canvas & bird count) --
  return (
    <div
      style={{
        width: canvasWidth,
        height: canvasHeight+56,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 24,
        boxShadow: '0 7px 42px 0 #abb8ff30,0 2px 2px #3f51b21a',
        background: '#ecf8fc',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        tabIndex={0}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          borderRadius: 24,
        }}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onMouseMove={onPointerMove}
        onTouchMove={onPointerMove}
        onMouseUp={onPointerUp}
        onTouchEnd={onPointerUp}
      />
      {/* Birds left counter */}
      <div style={{
        marginTop: 5, fontSize: 18,
        color: '#111', fontWeight: 500
      }}>
        <span style={{fontSize: 24}}>🐦</span>x{entities.birds.filter(b=>b.active && !b.resting).length}
        <span style={{marginLeft: 16, fontSize: 19, color: '#111a', fontWeight: 400}}>
          Pigs left: <span style={{ color: colors.secondary }}>{entities.pigs.filter(p=>p.active).length}</span>
        </span>
      </div>
      {/* Mobile drag tip */}
      <div style={{
        color: '#777', fontSize: 13, marginTop: 2, marginBottom: 1,
        letterSpacing: '0.4px'
      }}>
        {flying || gameState === 'cleared' || gameState === 'failed'
          ? <>&nbsp;</>
          : <>Drag the bird on the slingshot and release to launch!</>
        }
      </div>
    </div>
  );
}

// -- Game util & data -----------------------------------------------------
// Level presets: birds, pigs, and blocks
const levelsPreset = [
  // Level 1
  {
    birds: [{}, {}],
    pigs: [{x: 310, y: 209}],
    blocks: [
      {x: 292, y: 210, rot: 0},
      {x: 327, y: 210, rot: 0}
    ]
  },
  // Level 2
  {
    birds: [{}, {}, {}],
    pigs: [
      {x: 310, y: 172},
      {x: 364, y: 209}
    ],
    blocks: [
      {x: 282, y: 213, rot: 0.08},
      {x: 319, y: 192, rot:-0.07},
      {x: 357, y: 210, rot: 0.04},
      {x: 343, y: 180, rot: -0.1}
    ]
  },
  // Level 3 - larger pig fort
  {
    birds: [{}, {}, {}, {}],
    pigs: [
      {x: 349, y: 209},
      {x: 310, y: 175},
      {x: 393, y: 209},
    ],
    blocks: [
      {x: 302, y: 210, rot: 0},
      {x: 338, y: 191, rot: -0.09},
      {x: 375, y: 190, rot: 0.05},
      {x: 330, y: 164, rot: 0.11},
      {x: 368, y: 168, rot: -0.04}
    ]
  }
];

function initEntities(level) {
  // Defensive: ensure birds/pigs/blocks are always arrays
  const birds = Array.isArray(level?.birds) ? level.birds : [{}];
  const pigs = Array.isArray(level?.pigs) ? level.pigs : [];
  const blocks = Array.isArray(level?.blocks) ? level.blocks : [];
  return {
    birds: birds.map(() => ({
      x: 60, y: 174, vx: 0, vy: 0, active: true, resting: false,
    })),
    pigs: pigs.map(p => ({
      ...p, active: true,
    })),
    blocks: blocks.map(b => ({
      ...b, active: true, rotation: b.rot,
    }))
  };
}

// -- Styles/Palette --
const colors = {
  accent: '#FFC107',
  primary: '#2196F3',
  secondary: '#4CAF50'
};

const overlayStyle = {
  zIndex: 22,
  position: 'absolute',
  left: "50%",
  top: "26%",
  transform: "translate(-50%,0%)",
  background: "rgba(255,255,255,0.95)",
  borderRadius: 18,
  padding: '28px 57px',
  boxShadow: '0 2px 12px #4444',
  color: colors.secondary,
  fontWeight: 800,
  fontSize: 33,
  letterSpacing: 1.6
};

const gameContainerStyle = {
  marginTop: 22,
  marginBottom: 5,
  borderRadius: 24,
  background: "#e1f1ff",
  boxShadow: "0 5px 27px #abb8ff40",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

// -- Controls style in App.css --
/*
.ab-toolbar-btn {
  min-width: 87px;
  background: #2196F3;
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 18px;
  border-radius: 12px;
  padding: 9px 16px;
  margin: 2px;
  cursor: pointer;
  transition: all 0.21s;
  box-shadow: 0 2px 10px #2196F322;
}
.ab-toolbar-btn:disabled {
  opacity: 0.6;
  background: #ddd;
  color: #bbb;
  cursor: not-allowed;
}
.ab-toolbar-btn:hover:enabled {
  background: #FFC107;
  color: #222;
  box-shadow: 0 4px 12px #FFC10766;
}
.level-message {
  pointer-events: none;
  animation: msgpop 1.3s ease;
}
@keyframes msgpop {
  0% { transform:scale(0.9) translate(-50%,0%); opacity: 0; }
  15% { opacity: 1;}
  50% { transform:scale(1.05) translate(-50%,0%);}
  75% { transform:scale(0.97) translate(-50%,0%);}
  100% { opacity: 1;}
}
*/

// -- Sounds (base64 wav: cartoon pop, slingshot, pig oink, win, fail) --
const slingshot_wav =
  "data:audio/wav;base64,UklGRqABAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdwAAACAgGCAf6B3HiAQf4CAjIAXF9YeVVbX5uXNboIXlvw8v78+sF/gn5gxYfFjAv8Xy5jUFgiO07JuV+idYp9xbbyfXAnznnA5sAgQj+F3xtU7z7/J+7VdP44Q==";
const pop_wav =
  "data:audio/wav;base64,UklGRkoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYwAAACAgH9/f4CAf4B4j4OPgX+BfqBtHfT7er++tj4M+QkA3v/Xc9DDwpDouOw/Of4f+x/j/3yg==";
const oink_wav =
  "data:audio/wav;base64,UklGRngAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYIAAABkZoONfHEgT0AMaGdYoJg7jodYjY0ZhmWPU6YAAgA3o6eWf33kv78=";
const win_wav =
  "data:audio/wav;base64,UklGRqABAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YbAAAAAAgJ9QcxhVwH6BcSd8/pBQABiAgEOAgIODgH8Y3kA1VkgAyFV";
const fail_wav =
  "data:audio/wav;base64,UklGRlgAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYwAAACAf4CAf4SHhP8jI0fPzM/P/5OvMA==";

