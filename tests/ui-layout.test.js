/**
 * Layout contract tests for the board-first Gomoku interface.
 */
QUnit.module('UI Layout Contract', function() {
  QUnit.test('main game regions exist in the page shell', function(assert) {
    assert.ok(document.querySelector('.game-container'), 'game container exists');
    assert.ok(document.querySelector('.header'), 'header exists');
    assert.ok(document.querySelector('.game-shell'), 'game shell exists');
    assert.ok(document.querySelector('.game-status'), 'status rail exists');
    assert.ok(document.querySelector('.board-stage'), 'board stage exists');
    assert.ok(document.querySelector('.game-actions'), 'action rail exists');
  });

  QUnit.test('existing JavaScript ids are preserved', function(assert) {
    ['difficulty', 'settings', 'status-bar', 'status', 'status-actions', 'timer-black', 'timer-white', 'board'].forEach(function(id) {
      assert.ok(document.getElementById(id), '#' + id + ' exists');
    });
  });

  QUnit.test('board remains a 15 by 15 grid after initialization', function(assert) {
    var board = document.getElementById('board');
    assert.ok(board, 'board exists');
    assert.equal(board.querySelectorAll('.cell').length, 225, 'board has 225 cells');
  });

  QUnit.test('layout regions use the board-first visual contract', function(assert) {
    var statusStyle = getComputedStyle(document.querySelector('.game-status'));
    var boardStyle = getComputedStyle(document.getElementById('board'));
    var actionsStyle = getComputedStyle(document.querySelector('.game-actions'));

    assert.equal(statusStyle.display, 'grid', 'status rail uses grid');
    assert.ok(statusStyle.gridTemplateColumns.split(' ').length >= 3, 'status rail has three desktop columns');
    assert.equal(boardStyle.aspectRatio, '1 / 1', 'board keeps a square aspect ratio');
    assert.equal(actionsStyle.display, 'flex', 'action rail uses flex');
  });
});
