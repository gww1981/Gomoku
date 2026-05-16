/**
 * 模拟完整游戏流程来复现 "连续落5子" 的 bug
 */
const vm = require('vm');
const fs = require('fs');

global.window = {};
global.document = { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, documentElement: { style: {} } };
global.localStorage = { _data: {}, getItem: (k) => global.localStorage._data[k] || null, setItem: (k, v) => { global.localStorage._data[k] = String(v); }, removeItem: (k) => { delete global.localStorage._data[k]; }, clear: () => { global.localStorage._data = {}; } };
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

const files = ['game.js', 'event-emitter.js', 'timer-controller.js', 'ai.js', 'game-controller.js', 'replay.js'];
files.forEach(f => vm.runInThisContext(fs.readFileSync('js/' + f, 'utf-8'), 'js/' + f));

function countStones(board) {
  let n = 0;
  for (let r = 0; r < board.size; r++)
    for (let c = 0; c < board.size; c++)
      if (board.grid[r][c] !== 0) n++;
  return n;
}

const board = new Board(15);
const timer = new TimerController();
const ctrl = new GameController(timer);
ctrl.init(board);
ctrl.setMode('ai');
ctrl.setDifficulty('easy');
ctrl.state.isStarted = true;

console.log('=== Test 1: Single play ===');
ctrl.placeStone(7, 7);
console.log('Stones:', countStones(board), 'History:', ctrl.state.moveHistory.length, 'AIThinking:', ctrl.state.isAIThinking);

setTimeout(() => {
  console.log('After AI:', 'Stones:', countStones(board), 'History:', ctrl.state.moveHistory.length, 'AIThinking:', ctrl.state.isAIThinking);

  console.log('\n=== Test 2: Rapid clicks during AI thinking ===');
  // Click while AI is still thinking (within 100ms)
  const rejected = ctrl.playMove(8, 8);
  console.log('Click during AI thinking:', rejected ? 'ACCEPTED!' : 'REJECTED (OK)');
  console.log('Stones:', countStones(board), 'History:', ctrl.state.moveHistory.length);

  setTimeout(() => {
    console.log('After AI2:', 'Stones:', countStones(board), 'History:', ctrl.state.moveHistory.length);
    
    console.log('\n=== Test 3: Rapid clicks during sync AI computation ===');
    // The AI computation is synchronous in fallback mode.
    // Verify the EasyMove simulation doesn't corrupt state
    const b2 = new Board(15);
    b2.placeStone(7, 7, 1);
    console.log('Before getEasyMove: currentPlayer =', b2.currentPlayer, '(expected 2)');
    const move = getEasyMove(b2);
    console.log('After getEasyMove: currentPlayer =', b2.currentPlayer, '(expected 2)');
    console.log('AI move:', move);
    console.log('Stone count:', countStones(b2), '(expected 1)');
    
    console.log('\n=== Test 4: Simulate getAIMoveAsync flow ===');
    const b3 = new Board(15);
    b3.placeStone(7, 7, 1);
    const beforeCP = b3.currentPlayer;
    
    // This is what _triggerAIMove does
    getAIMoveAsync(b3, 'easy').then(move => {
      console.log('Async AI move:', move);
      console.log('currentPlayer unchanged:', b3.currentPlayer, '===', beforeCP, '?', b3.currentPlayer === beforeCP);
      console.log('Stone count unchanged:', countStones(b3), '=== 1 ?', countStones(b3) === 1);
      process.exit(0);
    });
  }, 300);
}, 300);

setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 2000);
