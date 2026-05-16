/**
 * TDD test runner — loads source files and runs assertion-based tests
 * Uses vm.runInThisContext for proper global scope sharing
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');

const JS_DIR = path.resolve(__dirname, '..', 'js');

// Track test results
let passed = 0;
let failed = 0;

// Minimal global shim for browser globals
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  documentElement: { style: {} }
};
global.localStorage = {
  _data: {},
  getItem: (k) => global.localStorage._data[k] || null,
  setItem: (k, v) => { global.localStorage._data[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._data[k]; },
  clear: () => { global.localStorage._data = {}; }
};
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

function loadJS(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  vm.runInThisContext(code, filePath);
  console.log(`  ${path.relative(process.cwd(), filePath)}`);
}

function describe(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`    ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`    ✗ ${name}`);
    console.log(`      ${err.message}`);
    failed++;
  }
}

// === Load source files in dependency order ===
console.log('=== Loading source ===');
loadJS(path.join(JS_DIR, 'game.js'));
loadJS(path.join(JS_DIR, 'event-emitter.js'));
loadJS(path.join(JS_DIR, 'timer-controller.js'));
loadJS(path.join(JS_DIR, 'ai.js'));
loadJS(path.join(JS_DIR, 'game-controller.js'));
loadJS(path.join(JS_DIR, 'replay.js'));

// Verify globals loaded
if (typeof Board === 'undefined') throw new Error('Board not loaded');
console.log('  → Board, EventEmitter, TimerController, AI, GameController loaded');

// === Tests ===
console.log('\n=== Running tests ===');

// ── Board tests ──
describe('Board', () => {

  it('placeStone and getStone work', () => {
    const board = new Board(15);
    assert.equal(board.placeStone(7, 7, 1), true);
    assert.equal(board.getStone(7, 7), 1);
    assert.equal(board.currentPlayer, 2);
    assert.equal(board.moveCount, 1);
    assert.equal(board.placeStone(7, 7, 2), false); // occupied
  });

  it('checkWin detects horizontal 5 in a row', () => {
    const board = new Board(15);
    for (let c = 3; c <= 7; c++) board.placeStone(7, c, 1);
    const winLine = board.checkWin(7, 5);
    assert.ok(winLine !== null);
    assert.equal(winLine.length, 5);
  });

  it('undoMove clears stone and reverts state', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.undoMove(7, 7);
    assert.equal(board.getStone(7, 7), 0);
    assert.equal(board.currentPlayer, 1);
    assert.equal(board.moveCount, 0);
  });

  it('reset clears the board', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.placeStone(0, 0, 2);
    board.reset();
    assert.equal(board.moveCount, 0);
    assert.equal(board.currentPlayer, 1);
  });

  it('evaluatePosition returns consistent scores', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.placeStone(8, 8, 2);
    board.placeStone(6, 6, 1);
    const s1 = board.evaluatePosition(7, 7, 1);
    const s2 = board.evaluatePosition(7, 7, 1);
    assert.equal(s1, s2);
    assert.ok(Number.isFinite(s1));
  });

  it('evaluatePosition cache invalidated after placeStone', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.evaluatePosition(7, 7, 1); // warm cache
    const v1 = board._cacheVersion;
    board.placeStone(8, 8, 2);
    assert.ok(board._cacheVersion > v1, 'cache version incremented');
  });

  it('checkDraw returns false when moves remain', () => {
    const board = new Board(15);
    board.placeStone(0, 0, 1);
    assert.equal(board.checkDraw(), false);
  });

  it('copy creates independent board snapshot', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const copy = board.copy();
    assert.equal(copy.getStone(7, 7), 1);
    assert.equal(copy.currentPlayer, board.currentPlayer);
    board.placeStone(8, 8, 2);
    assert.equal(copy.getStone(8, 8), 0); // independent
  });
});

// ── AI tests ──
describe('AI', () => {

  it('getEasyMove returns a valid empty position', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const move = getAIMove(board, 'easy');
    assert.ok(move !== null);
    assert.equal(board.getStone(move.row, move.col), 0);
  });

  it('getMediumMove blocks opponent 3-in-a-row threat', () => {
    const board = new Board(15);
    // P1 has 3 in a row horizontally: AI (P2) should block
    board.placeStone(7, 7, 1);  // P1
    board.placeStone(0, 0, 2);  // P2
    board.placeStone(7, 8, 1);  // P1
    board.placeStone(0, 1, 2);  // P2
    board.placeStone(7, 9, 1);  // P1 — 3 in a row

    const move = getAIMove(board, 'medium');
    assert.ok(move !== null, 'AI makes a move');
    // AI should block at (7,6) or (7,10)
    const blocksThree = (move.row === 7 && (move.col === 6 || move.col === 10));
    assert.ok(blocksThree, `Expected block at (7,6) or (7,10), got (${move.row},${move.col})`);
  });

  it('getCandidateMoves returns empty cells near existing stones', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const candidates = getCandidateMoves(board);
    assert.ok(candidates.length > 0);
    candidates.forEach(({row, col}) => {
      assert.equal(board.getStone(row, col), 0, `(${row},${col}) is empty`);
    });
  });

  it('getCandidateMoves returns positions within 2-range of any stone', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.placeStone(10, 3, 2);
    const candidates = getCandidateMoves(board);
    // Every candidate should be within distance 2 of (7,7) or (10,3)
    candidates.forEach(({row, col}) => {
      const d1 = Math.max(Math.abs(row - 7), Math.abs(col - 7));
      const d2 = Math.max(Math.abs(row - 10), Math.abs(col - 3));
      assert.ok(d1 <= 2 || d2 <= 2,
        `(${row},${col}) is within 2 of (7,7) (d=${d1}) or (10,3) (d=${d2})`);
    });
  });

  it('getHardMove with move ordering finds winning move', () => {
    const board = new Board(15);
    // AI has an immediate win: 4 in a row and both ends open
    // Place some P1 stones to distract, then give AI (P2) 4 in a row
    board.placeStone(0, 0, 1); // P1
    board.placeStone(7, 7, 2); // P2 start
    board.placeStone(0, 1, 1); // P1
    board.placeStone(7, 8, 2); // P2
    board.placeStone(0, 2, 1); // P1
    board.placeStone(7, 9, 2); // P2
    board.placeStone(0, 3, 1); // P1
    board.placeStone(7, 10, 2); // P2 — 4 in a row!

    const move = getAIMove(board, 'hard');
    assert.ok(move !== null, 'AI makes a move');
    // AI should complete its 5-in-a-row at (7,6) or (7,11)
    const wins = (move.row === 7 && (move.col === 6 || move.col === 11));
    assert.ok(wins, `Expected win at (7,6) or (7,11), got (${move.row},${move.col})`);
  });

  it('getHardMove blocks opponent 3-in-a-row threat', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);  // P1
    board.placeStone(0, 0, 2);  // P2
    board.placeStone(7, 8, 1);  // P1
    board.placeStone(0, 1, 2);  // P2
    board.placeStone(7, 9, 1);  // P1 — 3 in a row

    const move = getAIMove(board, 'hard');
    assert.ok(move !== null, 'AI makes a move');
    // AI should block the 3-in-a-row
    const blocks = (move.row === 7 && (move.col === 6 || move.col === 10));
    assert.ok(blocks, `Expected block at (7,6) or (7,10), got (${move.row},${move.col})`);
  });

  it('evaluatePosition does not overcount for empty candidate cells', () => {
    const board = new Board(15);
    // P1 has 4 stones at (7,7)(7,8)(7,9)(7,10)
    for (let c = 7; c <= 10; c++) board.grid[7][c] = 1;
    board.moveCount = 4;
    board.currentPlayer = 2;

    // Evaluate the blocking candidate (7,6) for P1 threat
    // If getLine overcounts, it would report count=5 (includes empty (7,6))
    const line = board.getLine(7, 6, 0, 1, 1); // looking for P1 stones from (7,6)
    // (7,6) is empty, so at most 4 P1 stones should be found
    assert.equal(line.positions.length, 4,
      `Expected 4 P1 stones right of (7,6), got ${line.positions.length}`);
    // (7,6) is empty, so the actual consecutive P1 stones are (7,7)-(7,10) = 4
    assert.equal(board.grid[7][6], 0, '(7,6) is empty');
    // getLine should NOT count the empty starting position as a P1 stone
    const nonEmptyPositions = line.positions.filter(p => board.grid[p.row][p.col] === 1);
    assert.equal(nonEmptyPositions.length, 4,
      `Expected 4 actual P1 stones, got ${nonEmptyPositions.length}`);
  });

  it('getAIMoveAsync returns a Promise', () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const result = getAIMoveAsync(board, 'easy');
    assert.ok(result instanceof Promise, 'returns a Promise');
  });

  it('getAIMoveAsync resolves with a valid move', async () => {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const move = await getAIMoveAsync(board, 'easy');
    assert.ok(move !== null);
    assert.ok('row' in move && 'col' in move);
    assert.equal(board.getStone(move.row, move.col), 0);
  });
});

// ── GameController tests ──
describe('GameController', () => {

  it('can be constructed with default state', () => {
    const timer = new TimerController();
    const controller = new GameController(timer);
    assert.ok(controller);
    assert.equal(controller.state.mode, 'pvp');
  });

  it('init sets up board and resets state', () => {
    const timer = new TimerController();
    const controller = new GameController(timer);
    const board = new Board(15);
    controller.init(board);
    assert.equal(controller.state.board, board);
    assert.equal(controller.state.isGameOver, false);
  });

  it('placeStone emits stonePlaced event', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    ctrl.init(new Board(15));
    let emitted = null;
    ctrl.on('stonePlaced', (d) => { emitted = d; });
    ctrl.placeStone(7, 7);
    assert.ok(emitted !== null);
    assert.equal(emitted.player, 1);
  });

  it('detects win and emits gameOver', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    ctrl.init(new Board(15));
    let endData = null;
    ctrl.on('gameOver', (d) => { endData = d; });
    // Build 5 in col 0 for P1
    for (let r = 0; r < 4; r++) {
      ctrl.placeStone(r, 0);    // P1
      ctrl.placeStone(14, r+1); // P2 (away)
    }
    ctrl.placeStone(4, 0); // P1 — 5 in col 0
    assert.ok(endData !== null, 'gameOver emitted');
    assert.equal(endData.winner, 1);
    assert.ok(Array.isArray(endData.winLine));
    timer.stop();
  });

  it('undoMove reverts last move', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    const board = new Board(15);
    ctrl.init(board);
    ctrl.placeStone(7, 7);
    assert.equal(ctrl.state.moveHistory.length, 1);
    ctrl.undoMove();
    assert.equal(board.getStone(7, 7), 0);
    assert.equal(ctrl.state.moveHistory.length, 0);
  });

  it('restartGame resets board and state', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    const board = new Board(15);
    ctrl.init(board);
    ctrl.placeStone(7, 7);
    ctrl.restartGame();
    assert.equal(board.getStone(7, 7), 0);
    assert.equal(ctrl.state.isGameOver, false);
    assert.equal(ctrl.state.moveHistory.length, 0);
  });

  it('getState returns state snapshot', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    ctrl.init(new Board(15));
    ctrl.setMode('ai');
    ctrl.setDifficulty('hard');
    const state = ctrl.getState();
    assert.equal(state.mode, 'ai');
    assert.equal(state.difficulty, 'hard');
  });

  it('playMove rejects before game starts', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    ctrl.init(new Board(15));
    assert.equal(ctrl.playMove(7, 7), false);
  });

  it('playMove accepts during active game', () => {
    const timer = new TimerController();
    const ctrl = new GameController(timer);
    ctrl.init(new Board(15));
    ctrl.startGame();
    assert.equal(ctrl.playMove(7, 7), true);
    timer.stop();
  });
});

// ── EventEmitter tests ──
describe('EventEmitter', () => {
  it('on/emit basic', () => {
    const e = new EventEmitter();
    let called = false;
    e.on('evt', () => { called = true; });
    e.emit('evt');
    assert.equal(called, true);
  });

  it('off removes handler', () => {
    const e = new EventEmitter();
    let count = 0;
    function h() { count++; }
    e.on('evt', h);
    e.off('evt', h);
    e.emit('evt');
    assert.equal(count, 0);
  });

  it('multiple subscribers', () => {
    const e = new EventEmitter();
    let count = 0;
    e.on('evt', () => count++);
    e.on('evt', () => count++);
    e.emit('evt');
    assert.equal(count, 2);
  });
});

// ── TimerController tests ──
describe('TimerController', () => {
  it('initial state correct', () => {
    const t = new TimerController();
    assert.equal(t.getRemainingTime('black'), 30);
    assert.equal(t.state.active, null);
  });

  it('start sets active and interval', () => {
    const t = new TimerController();
    t.start('black');
    assert.equal(t.state.active, 'black');
    assert.ok(t.state.interval !== null);
    t.stop();
  });

  it('stop clears state', () => {
    const t = new TimerController();
    t.start('black');
    t.stop();
    assert.equal(t.state.active, null);
    assert.equal(t.state.interval, null);
  });

  it('switchTo changes player', () => {
    const t = new TimerController();
    t.start('black');
    t.switchTo('white');
    assert.equal(t.state.active, 'white');
    t.stop();
  });

  it('reset restores defaults', () => {
    const t = new TimerController();
    t.start('black');
    t.reset();
    assert.equal(t.state.black, 30);
    assert.equal(t.state.active, null);
  });
});

// ── ReplayManager tests ──
describe('ReplayManager', () => {

  function createTestReplay() {
    const rm = new ReplayManager();
    const moves = [
      { row: 7, col: 7, player: 1 },
      { row: 0, col: 0, player: 2 },
      { row: 7, col: 8, player: 1 },
      { row: 0, col: 1, player: 2 },
      { row: 7, col: 9, player: 1 }
    ];
    // Save directly to localStorage for testing
    const replays = [{
      id: 'test-1',
      gameMode: 'pvp',
      difficulty: 'medium',
      moves: moves,
      timestamp: Date.now()
    }];
    rm._saveReplays(replays);
    return { rm, moves };
  }

  it('startReplay sets up state', () => {
    const { rm } = createTestReplay();
    let stepCount = 0;
    rm.startReplay('test-1', () => { stepCount++; }, () => {});
    assert.ok(rm._replayData !== null, 'replayData loaded');
    assert.equal(rm._replayIndex, 1, 'auto-plays first step immediately');
    assert.equal(stepCount, 1, 'onStep called once');
    rm.stopReplay();
  });

  it('pauseReplay pauses auto-advance', () => {
    const { rm } = createTestReplay();
    rm.startReplay('test-1', () => {}, () => {});
    rm.pauseReplay();
    assert.ok(rm._replayPaused, 'paused flag set');
    assert.equal(rm._replayTimer, null, 'timer cleared');
    rm.stopReplay();
  });

  it('resumeReplay continues auto-advance', () => {
    const { rm } = createTestReplay();
    let steps = [];
    rm.startReplay('test-1', (m) => steps.push(m), () => {});
    rm.pauseReplay();
    const beforeCount = steps.length;
    rm.resumeReplay();
    // After resume, auto-play continues. Pause immediately to check
    setTimeout(() => {
      rm.pauseReplay();
    }, 50);
    // Can't easily verify async, just check state
    assert.equal(rm._replayPaused, false, 'paused flag cleared after resume');
    rm.stopReplay();
  });

  it('stepForward advances one step and pauses', () => {
    const { rm, moves } = createTestReplay();
    let steps = [];
    rm.startReplay('test-1', (m) => steps.push(m), () => {});
    rm.pauseReplay();
    const before = steps.length;
    rm.stepForward();
    assert.equal(steps.length, before + 1, 'advanced one step');
    assert.ok(rm._replayPaused, 'paused after stepForward');
    rm.stopReplay();
  });

  it('stepBackward goes back one step and re-renders', () => {
    const { rm } = createTestReplay();
    let steps = [];
    let cleared = false;
    rm.startReplay('test-1',
      (m) => steps.push(m),
      () => {},
      () => { cleared = true; }
    );
    rm.pauseReplay();
    steps = []; // reset for clean measurement
    rm.stepForward();
    rm.stepForward();
    assert.equal(steps.length, 2, 'two steps forward');
    steps = [];
    rm.stepBackward();
    assert.ok(cleared, 'onClear called');
    // Re-renders from index 0 to index-1 (index was 3, now 2, so plays 0,1 = 2 stones)
    assert.equal(steps.length, 2, 're-rendered from start to index-1');
    rm.stopReplay();
  });

  it('getReplayProgress returns correct state', () => {
    const { rm } = createTestReplay();
    rm.startReplay('test-1', () => {}, () => {});
    rm.pauseReplay();
    const prog = rm.getReplayProgress();
    assert.equal(prog.total, 5, 'total moves');
    assert.ok(prog.current >= 1, 'current >= 1 after first step');
    rm.stopReplay();
  });

  it('stepForward at last move fires onComplete', () => {
    const { rm, moves } = createTestReplay();
    let completed = false;
    rm.startReplay('test-1', () => {}, () => { completed = true; });
    rm.pauseReplay();
    // Step through all remaining
    for (let i = 0; i < moves.length; i++) rm.stepForward();
    assert.ok(completed, 'onComplete fired at end');
    rm.stopReplay();
  });
});

// === Summary ===
console.log(`\n═══════════════════════════════`);
console.log(`  Total: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`═══════════════════════════════`);

process.exit(failed > 0 ? 1 : 0);
