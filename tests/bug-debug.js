const vm = require('vm');
const fs = require('fs');

global.window = {};
global.document = { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, documentElement: { style: {} } };
global.localStorage = { _data: {}, getItem: (k) => global.localStorage._data[k] || null, setItem: (k, v) => { global.localStorage._data[k] = String(v); }, removeItem: (k) => { delete global.localStorage._data[k]; }, clear: () => { global.localStorage._data = {}; } };
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout; global.setInterval = setInterval; global.clearInterval = clearInterval;

const files = ['game.js', 'event-emitter.js', 'timer-controller.js', 'ai.js', 'game-controller.js', 'replay.js'];
files.forEach(f => vm.runInThisContext(fs.readFileSync('js/' + f, 'utf-8'), 'js/' + f));

// Test with detailed logging
const board = new Board(15);
board.placeStone(7, 7, 1);
console.log('Initial: currentPlayer =', board.currentPlayer, 'moveCount =', board.moveCount, 'stones = 1');

// Step through getEasyMove manually
const empty = board.getEmptyPositions();
console.log('Empty positions count:', empty.length);

// Simulate first few iterations of step 1
console.log('\n--- Step 1: Check AI win (first 3 positions) ---');
for (let i = 0; i < Math.min(3, empty.length); i++) {
  const pos = empty[i];
  console.log(`\n  Iteration ${i}: place at (${pos.row},${pos.col})`);
  console.log('    Before placeStone: currentPlayer =', board.currentPlayer, 'grid[7,7] =', board.grid[7][7]);
  board.placeStone(pos.row, pos.col, AI_PLAYER);
  console.log('    After placeStone:  currentPlayer =', board.currentPlayer, 'grid at pos =', board.grid[pos.row][pos.col]);
  const winLine = board.checkWin(pos.row, pos.col);
  console.log('    After checkWin:    currentPlayer =', board.currentPlayer, 'winLine =', !!winLine);
  board.undoMove(pos.row, pos.col);
  console.log('    After undoMove:    currentPlayer =', board.currentPlayer, 'grid at pos =', board.grid[pos.row][pos.col]);
}

console.log('\nAfter step 1 (all): currentPlayer =', board.currentPlayer, 'moveCount =', board.moveCount);

// Now let's run the actual getEasyMove
console.log('\n--- Running getEasyMove ---');
const board2 = new Board(15);
board2.placeStone(7, 7, 1);
console.log('Before: currentPlayer =', board2.currentPlayer);
const move = getEasyMove(board2);
console.log('After:  currentPlayer =', board2.currentPlayer);
console.log('Move:', JSON.stringify(move));

// Let's also verify the Board.undoMove function
console.log('\n--- Verify undoMove behavior ---');
const b3 = new Board(15);
console.log('Initial cp:', b3.currentPlayer);
b3.placeStone(3, 3, 1);
console.log('After P1(3,3): cp =', b3.currentPlayer);
b3.undoMove(3, 3);
console.log('After undo(3,3): cp =', b3.currentPlayer);

b3.placeStone(4, 4, 2);
console.log('After P2(4,4): cp =', b3.currentPlayer);
b3.undoMove(4, 4);
console.log('After undo(4,4): cp =', b3.currentPlayer);
