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
});