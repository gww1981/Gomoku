/**
 * ui-core 模式选择与开始按钮测试
 */
QUnit.module('模式选择与开始按钮', function(hooks) {
  hooks.beforeEach(function() {
    // 重置游戏状态
    GameState.mode = 'pvp';
    GameState.difficulty = 'medium';
    GameState.isGameOver = false;
    GameState.isAIThinking = false;
    GameState.isStarted = false;
    GameState.moveHistory = [];
    GameState.board = new Board(BOARD_SIZE || 15);

    // 重置 DOM 状态
    var board = document.getElementById('board');
    if (board) {
      board.classList.remove('waiting');
      var cells = board.querySelectorAll('.cell');
      for (var i = 0; i < cells.length; i++) {
        cells[i].className = 'cell';
      }
    }
    var statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = '';
    }
    var actionsEl = document.getElementById('status-actions');
    if (actionsEl) {
      actionsEl.innerHTML = '';
    }
    // 重置模式按钮状态
    var modeBtns = document.querySelectorAll('.mode-btn');
    for (var j = 0; j < modeBtns.length; j++) {
      modeBtns[j].classList.remove('active');
      if (modeBtns[j].dataset.mode === 'pvp') {
        modeBtns[j].classList.add('active');
      }
    }
  });

  // ===== isStarted 标志测试 =====

  QUnit.test('页面加载后 isStarted 应为 false', function(assert) {
    assert.strictEqual(GameState.isStarted, false, 'isStarted 初始为 false');
  });

  QUnit.test('startGame() 应设置 isStarted 为 true', function(assert) {
    startGame();
    assert.strictEqual(GameState.isStarted, true, 'startGame() 后 isStarted 为 true');
  });

  // ===== startGame() 测试 =====

  QUnit.test('startGame() 应更新状态栏显示回合信息', function(assert) {
    startGame();
    var statusEl = document.getElementById('status');
    assert.ok(statusEl, 'status 元素存在');
    assert.ok(statusEl.textContent.indexOf('回合') !== -1, '状态栏显示回合信息');
  });

  QUnit.test('startGame() 应移除棋盘的 waiting 类', function(assert) {
    var board = document.getElementById('board');
    board.classList.add('waiting');
    assert.ok(board.classList.contains('waiting'), '棋盘有 waiting 类');

    startGame();
    assert.ok(!board.classList.contains('waiting'), 'startGame() 后 waiting 类被移除');
  });

  QUnit.test('startGame() 后棋盘应可点击', function(assert) {
    startGame();
    var board = document.getElementById('board');
    assert.ok(!board.classList.contains('waiting'), '棋盘可交互');
  });

  // ===== 未开始状态测试 =====

  QUnit.test('未开始时状态栏应显示开始按钮', function(assert) {
    GameState.isStarted = false;
    updateStatusBar();
    var actionsEl = document.getElementById('status-actions');
    assert.ok(actionsEl.innerHTML.indexOf('start-btn') !== -1, '状态栏包含开始按钮');
  });

  QUnit.test('未开始时棋盘应有 waiting 类', function(assert) {
    GameState.isStarted = false;
    updateStatusBar();
    var board = document.getElementById('board');
    assert.ok(board.classList.contains('waiting'), '未开始时棋盘有 waiting 类');
  });

  // ===== handleBoardClick 拦截测试 =====

  QUnit.test('isStarted 为 false 时 handleBoardClick 应拦截落子', function(assert) {
    GameState.isStarted = false;
    var cell = document.querySelector('.cell[data-row="7"][data-col="7"]');

    handleBoardClick({ target: cell });

    assert.strictEqual(GameState.moveHistory.length, 0, '未开始时落子被拦截，moveHistory 为空');
  });

  QUnit.test('isStarted 为 true 时 handleBoardClick 应允许落子', function(assert) {
    GameState.isStarted = true;
    var cell = document.querySelector('.cell[data-row="7"][data-col="7"]');

    handleBoardClick({ target: cell });

    assert.equal(GameState.moveHistory.length, 1, '落子成功，记录数=1');
  });

  // ===== 模式切换测试 =====

  QUnit.test('切换模式后 isStarted 应重置为 false', function(assert) {
    GameState.isStarted = true;
    startGame();
    assert.strictEqual(GameState.isStarted, true, 'startGame 后 isStarted 为 true');

    // 模拟模式切换
    GameState.mode = 'ai';
    GameState.isStarted = false;
    restartGame();
    updateStatusBar();

    assert.strictEqual(GameState.isStarted, false, '模式切换后 isStarted 重置为 false');
  });

  QUnit.test('模式切换后状态栏应回到未开始状态', function(assert) {
    GameState.isStarted = true;
    GameState.mode = 'ai';
    GameState.isStarted = false;
    updateStatusBar();

    var actionsEl = document.getElementById('status-actions');
    assert.ok(actionsEl.innerHTML.indexOf('start-btn') !== -1, '模式切换后状态栏显示开始按钮');
  });

  // ===== 游戏结束再来一局测试 =====

  QUnit.test('游戏结束后再来一局应直接重启', function(assert) {
    // 先开始游戏
    GameState.isStarted = true;
    GameState.isGameOver = false;

    // 模拟游戏结束
    GameState.isGameOver = true;
    updateStatusBar();

    // 点击再来一局
    var restartBtn = document.getElementById('restart-btn');
    assert.ok(restartBtn, '再来一局按钮存在');
    assert.equal(restartBtn.textContent, '再来一局', '按钮文字为再来一局');

    restartBtn.click();

    assert.strictEqual(GameState.isGameOver, false, '再来一局后 isGameOver 为 false');
    assert.strictEqual(GameState.isStarted, true, '再来一局后 isStarted 保持 true');
  });

  // ===== AI 模式测试 =====

  QUnit.test('AI 模式下 isAIThinking 时状态栏应显示思考中', function(assert) {
    GameState.isStarted = true;
    GameState.mode = 'ai';
    GameState.isAIThinking = true;
    updateStatusBar();

    var statusEl = document.getElementById('status');
    assert.ok(statusEl.textContent.indexOf('思考') !== -1, '状态栏显示 AI 思考中');
  });

  // ===== 重新开始测试 =====

  QUnit.test('游戏中重新开始应保持 isStarted 为 true', function(assert) {
    GameState.isStarted = true;
    placeStone(7, 7);
    assert.strictEqual(GameState.moveHistory.length, 1, '有1步落子记录');

    restartGame();

    assert.strictEqual(GameState.isStarted, true, '重新开始后 isStarted 保持 true');
    assert.strictEqual(GameState.moveHistory.length, 0, '重新开始后落子记录清空');
  });

  // ===== bindStartButton 测试 =====

  QUnit.test('bindStartButton 应能绑定开始按钮', function(assert) {
    GameState.isStarted = false;
    updateStatusBar();

    var startBtn = document.getElementById('start-btn');
    assert.ok(startBtn, '开始按钮存在');

    bindStartButton();
    startBtn.click();

    assert.strictEqual(GameState.isStarted, true, '点击开始按钮后 isStarted 为 true');
  });

  // ===== bindStatusBarButtons 测试 =====

  QUnit.test('bindStatusBarButtons 应能绑定状态栏按钮', function(assert) {
    GameState.isStarted = true;
    GameState.isGameOver = true;
    updateStatusBar();

    var restartBtn = document.getElementById('restart-btn');
    assert.ok(restartBtn, '重新开始按钮存在');

    bindStatusBarButtons();
    restartBtn.click();

    assert.strictEqual(GameState.isGameOver, false, '点击重新开始后 isGameOver 为 false');
  });

  // ===== 悔棋后状态栏测试 =====

  QUnit.test('悔棋后状态栏应正确更新', function(assert) {
    GameState.isStarted = true;
    placeStone(7, 7);
    placeStone(7, 8);

    assert.equal(GameState.moveHistory.length, 2, '有2步落子记录');

    undoLastMove();

    assert.strictEqual(GameState.moveHistory.length, 1, '悔棋后有1步记录');
    var statusEl = document.getElementById('status');
    assert.ok(statusEl.textContent.indexOf('回合') !== -1, '状态栏显示回合信息');
  });

  // ===== 难度切换测试 =====

  QUnit.test('AI 模式下难度切换不应触发开始', function(assert) {
    GameState.isStarted = false;
    GameState.mode = 'ai';
    updateStatusBar();

    var difficultySelect = document.getElementById('difficulty');
    assert.ok(difficultySelect, '难度选择器存在');

    GameState.difficulty = 'hard';
    assert.strictEqual(GameState.isStarted, false, '切换难度后 isStarted 仍为 false');
  });
});
