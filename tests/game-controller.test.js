/**
 * GameController 单元测试
 */

QUnit.module('GameController', function() {

  QUnit.test('should be constructable', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    assert.ok(controller, 'GameController instance created');
    assert.strictEqual(controller.state.mode, 'pvp', 'default mode is pvp');
    assert.strictEqual(controller.state.difficulty, 'medium', 'default difficulty is medium');
    assert.strictEqual(controller.state.isStarted, false, 'isStarted is false initially');
  });

  QUnit.test('init() should set board and reset state', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);

    controller.init(board);

    assert.strictEqual(controller.state.board, board, 'board is set');
    assert.strictEqual(controller.state.isGameOver, false, 'isGameOver reset');
    assert.strictEqual(controller.state.moveHistory.length, 0, 'moveHistory cleared');
  });

  QUnit.test('setMode() should update mode', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);

    controller.setMode('ai');
    assert.strictEqual(controller.state.mode, 'ai', 'mode set to ai');

    controller.setMode('pvp');
    assert.strictEqual(controller.state.mode, 'pvp', 'mode set to pvp');
  });

  QUnit.test('setDifficulty() should update difficulty', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);

    controller.setDifficulty('hard');
    assert.strictEqual(controller.state.difficulty, 'hard', 'difficulty set to hard');

    controller.setDifficulty('easy');
    assert.strictEqual(controller.state.difficulty, 'easy', 'difficulty set to easy');
  });

  QUnit.test('startGame() should set isStarted and emit gameStarted', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var eventFired = false;
    var eventData = null;
    controller.on('gameStarted', function(data) {
      eventFired = true;
      eventData = data;
    });

    controller.startGame();

    assert.strictEqual(controller.state.isStarted, true, 'isStarted is true');
    assert.ok(eventFired, 'gameStarted event fired');
    assert.strictEqual(eventData.mode, 'pvp', 'event data contains mode');
  });

  QUnit.test('placeStone() should update board and history', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var result = controller.placeStone(7, 7);

    assert.ok(result, 'placeStone returns true');
    assert.strictEqual(board.getStone(7, 7), 1, 'stone placed on board');
    assert.strictEqual(controller.state.moveHistory.length, 1, 'move recorded');
    assert.strictEqual(controller.state.moveHistory[0].row, 7, 'move row recorded');
    assert.strictEqual(controller.state.moveHistory[0].col, 7, 'move col recorded');
  });

  QUnit.test('placeStone() should emit stonePlaced event', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var eventFired = false;
    var eventData = null;
    controller.on('stonePlaced', function(data) {
      eventFired = true;
      eventData = data;
    });

    controller.placeStone(7, 7);

    assert.ok(eventFired, 'stonePlaced event fired');
    assert.strictEqual(eventData.row, 7, 'event data row');
    assert.strictEqual(eventData.col, 7, 'event data col');
    assert.strictEqual(eventData.player, 1, 'event data player');
  });

  QUnit.test('playMove() should reject player moves before game start', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var result = controller.playMove(7, 7);

    assert.strictEqual(result, false, 'move rejected');
    assert.strictEqual(board.getStone(7, 7), 0, 'board remains empty');
    assert.strictEqual(controller.state.moveHistory.length, 0, 'history remains empty');
  });

  QUnit.test('playMove() should accept player moves during active game', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);
    controller.startGame();

    var result = controller.playMove(7, 7);

    assert.strictEqual(result, true, 'move accepted');
    assert.strictEqual(board.getStone(7, 7), 1, 'stone placed');
    assert.strictEqual(controller.state.moveHistory.length, 1, 'history updated');

    timer.stop();
  });

  QUnit.test('playMove() should reject player moves while AI is thinking', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);
    controller.startGame();
    controller.state.isAIThinking = true;

    var result = controller.playMove(7, 7);

    assert.strictEqual(result, false, 'move rejected');
    assert.strictEqual(board.getStone(7, 7), 0, 'board remains empty');

    timer.stop();
  });

  QUnit.test('placeStone() should reset mover timer and start opponent timer', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);
    controller.startGame();

    timer.state.black = 24;

    controller.placeStone(7, 7);

    assert.strictEqual(timer.getRemainingTime('black'), TimerController.TIMER_LIMIT, 'mover timer reset');
    assert.strictEqual(timer.getRemainingTime('white'), TimerController.TIMER_LIMIT, 'opponent timer starts at full limit');
    assert.strictEqual(timer.state.active, 'white', 'opponent timer is active');

    timer.stop();
  });

  QUnit.test('placeStone() should emit turnChanged after non-terminal move', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var eventData = null;
    controller.on('turnChanged', function(data) {
      eventData = data;
    });

    controller.placeStone(7, 7);

    assert.ok(eventData, 'turnChanged event fired');
    assert.strictEqual(eventData.player, 'white', 'turnChanged points at next timer player');
  });

  QUnit.test('placeStone() should emit gameOver on win', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var eventFired = false;
    var eventData = null;
    controller.on('gameOver', function(data) {
      eventFired = true;
      eventData = data;
    });

    // Create a vertical winning situation: 5 in a row for player 1 at column 0
    // Player 1 places at rows 1,2,3,4,5 (alternating with player 2)
    // Player 2 places elsewhere
    controller.placeStone(1, 0);  // player 1
    controller.placeStone(0, 1);  // player 2 (different column)
    controller.placeStone(2, 0);  // player 1
    controller.placeStone(0, 2);  // player 2
    controller.placeStone(3, 0);  // player 1
    controller.placeStone(0, 3);  // player 2
    controller.placeStone(4, 0);  // player 1
    controller.placeStone(0, 4);  // player 2
    controller.placeStone(5, 0);  // player 1 - 5 in column 0

    assert.ok(eventFired, 'gameOver event fired');
    assert.strictEqual(eventData.winner, 1, 'winner is player 1');
    assert.ok(Array.isArray(eventData.winLine), 'winLine is array');
    assert.strictEqual(controller.state.isGameOver, true, 'isGameOver is true');
  });

  QUnit.test('undoMove() should revert last move', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    controller.placeStone(7, 7);
    assert.strictEqual(board.getStone(7, 7), 1, 'stone on board');

    controller.undoMove();

    assert.strictEqual(board.getStone(7, 7), 0, 'stone removed');
    assert.strictEqual(controller.state.moveHistory.length, 0, 'history cleared');
  });

  QUnit.test('restartGame() should reset board and state', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    controller.placeStone(7, 7);
    controller.placeStone(8, 8);
    controller.startGame();

    controller.restartGame();

    assert.strictEqual(board.getStone(7, 7), 0, 'board reset');
    assert.strictEqual(controller.state.isGameOver, false, 'isGameOver reset');
    assert.strictEqual(controller.state.moveHistory.length, 0, 'history cleared');
  });

  QUnit.test('getState() should return state snapshot', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    controller.setMode('ai');
    controller.setDifficulty('hard');
    controller.placeStone(7, 7);

    var stateSnapshot = controller.getState();

    assert.strictEqual(stateSnapshot.mode, 'ai', 'snapshot mode');
    assert.strictEqual(stateSnapshot.difficulty, 'hard', 'snapshot difficulty');
    assert.strictEqual(stateSnapshot.moveHistory.length, 1, 'snapshot history');
  });

  QUnit.test('should publish timerExpired event handling via handleTimeout', function(assert) {
    var timer = new TimerController();
    var controller = new GameController(timer);
    var board = new Board(15);
    controller.init(board);

    var eventFired = false;
    var eventData = null;
    controller.on('timeout', function(data) {
      eventFired = true;
      eventData = data;
    });

    controller.handleTimeout('black');

    assert.ok(eventFired, 'timeout event fired');
    assert.strictEqual(eventData.player, 'black', 'timeout player');
    assert.strictEqual(eventData.winner, 2, 'winner is player 2');
    assert.strictEqual(controller.state.isGameOver, true, 'isGameOver is true');
  });

});
