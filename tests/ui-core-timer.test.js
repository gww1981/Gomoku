/**
 * ui-core 计时器刷新测试
 */
QUnit.module('UI Core Timer Display', function(hooks) {
  hooks.beforeEach(function() {
    GameState.mode = 'pvp';
    GameState.board = new Board(BOARD_SIZE || 15);
    GameState.isGameOver = false;
    GameState.isAIThinking = false;
    GameState.isReplaying = false;
    GameState.isStarted = true;

    if (typeof createBoardDOM === 'function') {
      createBoardDOM();
    }
    if (typeof restartGame === 'function') {
      restartGame();
    }
    if (typeof resetTimers === 'function') {
      resetTimers();
    }
  });

  QUnit.test('switchTimer should call updateTimerDisplay', function(assert) {
    var updateTimerDisplayCalled = false;
    var originalUpdateTimerDisplay = window.updateTimerDisplay;

    window.updateTimerDisplay = function() {
      updateTimerDisplayCalled = true;
    };

    switchTimer();

    window.updateTimerDisplay = originalUpdateTimerDisplay;

    assert.ok(updateTimerDisplayCalled, 'updateTimerDisplay was called during switchTimer');
  });

  QUnit.test('placeStone should trigger switchTimer and update timer display', function(assert) {
    var updateTimerDisplayCallCount = 0;
    var originalUpdateTimerDisplay = window.updateTimerDisplay;

    window.updateTimerDisplay = function() {
      updateTimerDisplayCallCount++;
    };

    // 初始化计时器
    startTimer();
    var initialCount = updateTimerDisplayCallCount;

    // 落子应触发 switchTimer
    placeStone(7, 7);

    window.updateTimerDisplay = originalUpdateTimerDisplay;

    assert.ok(updateTimerDisplayCallCount > initialCount, 'updateTimerDisplay called after placeStone');
  });

  QUnit.test('switchTimer should update timer display immediately', function(assert) {
    // 启动黑方计时器
    startTimer();

    var blackTimerEl = document.getElementById('timer-black');
    var whiteTimerEl = document.getElementById('timer-white');

    // 初始状态：黑方计时器激活
    assert.ok(blackTimerEl.classList.contains('timer-active'), '黑方计时器初始激活');

    // 落子切换到白方
    placeStone(7, 7);

    // 切换后：白方计时器应该激活
    assert.ok(whiteTimerEl.classList.contains('timer-active'), '白方计时器切换后激活');
    assert.ok(!blackTimerEl.classList.contains('timer-active'), '黑方计时器切换后非激活');
  });

  // Issue #33: 验证落子后计时器 UI 显示的秒数与 TimerController 实际剩余时间一致
  QUnit.test('placeStone 后计时器 UI 显示的秒数应与 TimerController 实际剩余时间一致', function(assert) {
    // 初始化游戏
    GameState.board = new Board(BOARD_SIZE || 15);
    GameState.isStarted = true;
    resetTimers();
    startTimer();

    var blackTimerEl = document.getElementById('timer-black');
    var whiteTimerEl = document.getElementById('timer-white');

    // 获取 TimerController 的实际剩余时间
    var timerController = getTimerController();
    var expectedBlackTime = timerController.getRemainingTime('black');
    var expectedWhiteTime = timerController.getRemainingTime('white');

    // 验证初始 UI 显示与 TimerController 一致
    var blackMatch = blackTimerEl.textContent.includes(expectedBlackTime + 's');
    var whiteMatch = whiteTimerEl.textContent.includes(expectedWhiteTime + 's');
    assert.ok(blackMatch, '黑方计时器 UI 显示应为 ' + expectedBlackTime + 's，实际: ' + blackTimerEl.textContent);
    assert.ok(whiteMatch, '白方计时器 UI 显示应为 ' + expectedWhiteTime + 's，实际: ' + whiteTimerEl.textContent);

    // 落子切换计时器（黑方 -> 白方）
    placeStone(7, 7);

    // 获取切换后的 TimerController 剩余时间
    var newBlackTime = timerController.getRemainingTime('black');
    var newWhiteTime = timerController.getRemainingTime('white');

    // 验证 UI 显示与切换后的 TimerController 一致
    var newBlackMatch = blackTimerEl.textContent.includes(newBlackTime + 's');
    var newWhiteMatch = whiteTimerEl.textContent.includes(newWhiteTime + 's');
    assert.ok(newBlackMatch, '落子后黑方计时器 UI 显示应为 ' + newBlackTime + 's，实际: ' + blackTimerEl.textContent);
    assert.ok(newWhiteMatch, '落子后白方计时器 UI 显示应为 ' + newWhiteTime + 's，实际: ' + whiteTimerEl.textContent);
  });

  // Issue #33: 验证计时器切换后显示的秒数正确（端到端测试）
  QUnit.test('计时器切换后秒数显示正确（端到端）', function(assert) {
    // 初始化
    GameState.board = new Board(BOARD_SIZE || 15);
    GameState.isStarted = true;
    resetTimers();
    startTimer();

    var blackTimerEl = document.getElementById('timer-black');
    var whiteTimerEl = document.getElementById('timer-white');

    // 初始状态：黑方计时器激活，白方非激活
    assert.ok(blackTimerEl.classList.contains('timer-active'), '初始时黑方计时器激活');
    assert.ok(!whiteTimerEl.classList.contains('timer-active'), '初始时白方计时器非激活');

    // 黑方落子 (7,7)，切换到白方
    placeStone(7, 7);

    // 验证白方计时器激活
    assert.ok(whiteTimerEl.classList.contains('timer-active'), '白方落子后白方计时器激活');

    // 等待 1 秒让计时器递减
    var done = assert.async();
    setTimeout(function() {
      // 白方计时器应该递减了 1 秒
      var expectedWhiteTime = getTimerController().getRemainingTime('white');
      var actualWhiteTime = parseInt(whiteTimerEl.textContent.match(/(\d+)s/)[1], 10);

      assert.equal(actualWhiteTime, expectedWhiteTime,
        '白方计时器 UI 显示 ' + actualWhiteTime + 's 应等于 TimerController 的 ' + expectedWhiteTime + 's');

      done();
    }, 1100);
  });

  QUnit.test('落子后自己计时器应重置为 30 秒，对方计时器启动', function(assert) {
    var done = assert.async();

    GameState.board = new Board(BOARD_SIZE || 15);
    GameState.isStarted = true;
    resetTimers();
    startTimer();

    setTimeout(function() {
      // 黑方先走过至少 1 秒
      var blackBeforeMove = getTimerController().getRemainingTime('black');
      assert.ok(blackBeforeMove <= 29, '黑方在落子前已消耗时间');

      // 黑方落子 -> 白方回合
      placeStone(7, 7);

      var blackAfterMove = getTimerController().getRemainingTime('black');
      var whiteAfterMove = getTimerController().getRemainingTime('white');
      var active = getTimerController().state.active;

      assert.equal(blackAfterMove, TIMER_LIMIT, '黑方落子后自身计时重置为 30 秒');
      assert.equal(whiteAfterMove, TIMER_LIMIT, '白方回合启动时为 30 秒');
      assert.equal(active, 'white', '对方计时器已启动');

      done();
    }, 1100);
  });
});
