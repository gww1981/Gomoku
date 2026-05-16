const vm = require('vm');
const fs = require('fs');

global.window = {};
global.document = { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, documentElement: { style: {} } };
global.localStorage = { _data: {}, getItem: (k) => global.localStorage._data[k] || null, setItem: (k, v) => { global.localStorage._data[k] = String(v); }, removeItem: (k) => { delete global.localStorage._data[k]; }, clear: () => { global.localStorage._data = {}; } };
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout; global.setInterval = setInterval; global.clearInterval = clearInterval;

const files = ['game.js', 'event-emitter.js', 'timer-controller.js', 'ai.js', 'game-controller.js', 'replay.js'];
files.forEach(f => vm.runInThisContext(fs.readFileSync('js/' + f, 'utf-8'), 'js/' + f));

// Monkey-patch getEasyMove to add debugging
const origGetEasy = getEasyMove;
getEasyMove = function(board) {
  const emptyPositions = board.getEmptyPositions();
  if (emptyPositions.length === 0) return null;

  // Step 1
  for (let i = 0; i < emptyPositions.length; i++) {
    const pos = emptyPositions[i];
    const cpBefore1 = board.currentPlayer;
    board.placeStone(pos.row, pos.col, AI_PLAYER);
    const cpAfterPlace = board.currentPlayer;
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    const cpAfterUndo = board.currentPlayer;
    
    if (cpBefore1 !== cpAfterUndo) {
      console.log(`STEP 1 ITER ${i}: cp ${cpBefore1} → place(${cpAfterPlace}) → undo(${cpAfterUndo}) — BAD!`);
    }
    if (winLine) return pos;
  }

  // Step 2
  for (let i = 0; i < emptyPositions.length; i++) {
    const pos = emptyPositions[i];
    const cpBefore2 = board.currentPlayer;
    board.placeStone(pos.row, pos.col, PLAYER);
    const cpAfterPlace = board.currentPlayer;
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    const cpAfterUndo = board.currentPlayer;
    
    if (cpBefore2 !== cpAfterUndo) {
      console.log(`STEP 2 ITER ${i}: cp ${cpBefore2} → place(${cpAfterPlace}) → undo(${cpAfterUndo}) — BAD!`);
    }
    if (winLine) return pos;
  }

  console.log('After step 2: currentPlayer =', board.currentPlayer);

  let candidates = getCandidateMoves(board);
  if (candidates.length === 0) {
    return { row: Math.floor(board.size / 2), col: Math.floor(board.size / 2) };
  }

  const scored = candidates.map(pos => ({
    row: pos.row, col: pos.col,
    score: board.evaluatePosition(pos.row, pos.col, AI_PLAYER) + board.evaluatePosition(pos.row, pos.col, PLAYER)
  }));
  scored.sort((a, b) => b.score - a.score);
  const topN = scored.slice(0, Math.min(5, scored.length));
  const weightSum = topN.reduce((sum, m) => sum + Math.max(1, m.score), 0);
  let rand = Math.random() * weightSum;
  for (const move of topN) {
    rand -= Math.max(1, move.score);
    if (rand <= 0) return move;
  }
  return topN[0];
};

const b = new Board(15);
b.placeStone(7, 7, 1);
console.log('Before getEasyMove: currentPlayer =', b.currentPlayer);
const result = getEasyMove(b);
console.log('After getEasyMove: currentPlayer =', b.currentPlayer);
console.log('Result:', JSON.stringify(result));
