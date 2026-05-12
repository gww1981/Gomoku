/**
 * ui-core 最后落子高亮测试
 */
QUnit.module('UI Core Last Move Highlight', function(hooks) {
  hooks.beforeEach(function() {
    GameState.mode = 'pvp';
    if (typeof restartGame === 'function') {
      restartGame();
    }
  });

  QUnit.test('valid moves should keep exactly one last-move marker', function(assert) {
    placeStone(7, 7);
    assert.equal(document.querySelectorAll('.cell.last-move').length, 1, 'one marker after first move');
    assert.ok(document.querySelector('.cell[data-row="7"][data-col="7"]').classList.contains('last-move'), 'first move marked');

    placeStone(7, 8);
    assert.equal(document.querySelectorAll('.cell.last-move').length, 1, 'still one marker after second move');
    assert.ok(document.querySelector('.cell[data-row="7"][data-col="8"]').classList.contains('last-move'), 'marker switched to second move');
  });

  QUnit.test('last move marker should render a visible ring on the placed stone', function(assert) {
    placeStone(7, 7);

    const cell = document.querySelector('.cell[data-row="7"][data-col="7"]');
    const markerStyle = getComputedStyle(cell, '::after');

    assert.equal(markerStyle.borderTopStyle, 'solid', 'marker ring border is rendered');
    assert.equal(markerStyle.borderTopWidth, '2px', 'marker ring has visible width');
    assert.ok(markerStyle.borderTopColor.includes('255, 215, 0'), 'marker ring uses gold highlight color');
  });

  QUnit.test('AI mode should switch marker from player move to AI move', function(assert) {
    const done = assert.async();
    const originalGetAIMove = window.getAIMove;

    GameState.mode = 'ai';
    window.getAIMove = function() {
      return { row: 7, col: 8 };
    };

    placeStone(7, 7);
    assert.ok(document.querySelector('.cell[data-row="7"][data-col="7"]').classList.contains('last-move'), 'player move marked first');

    setTimeout(function() {
      assert.equal(document.querySelectorAll('.cell.last-move').length, 1, 'still one marker after AI move');
      assert.ok(document.querySelector('.cell[data-row="7"][data-col="8"]').classList.contains('last-move'), 'marker switched to AI move');
      window.getAIMove = originalGetAIMove;
      done();
    }, 700);
  });

  QUnit.test('undo should restore marker to history tail', function(assert) {
    placeStone(7, 7);
    placeStone(7, 8);
    placeStone(8, 7);

    assert.ok(document.querySelector('.cell[data-row="8"][data-col="7"]').classList.contains('last-move'), 'third move marked');

    undoLastMove();
    assert.equal(document.querySelectorAll('.cell.last-move').length, 1, 'one marker after undo');
    assert.ok(document.querySelector('.cell[data-row="7"][data-col="8"]').classList.contains('last-move'), 'marker restored to previous move');
  });

  QUnit.test('restart should clear marker', function(assert) {
    placeStone(7, 7);
    assert.equal(document.querySelectorAll('.cell.last-move').length, 1, 'marker exists before restart');

    restartGame();
    assert.equal(document.querySelectorAll('.cell.last-move').length, 0, 'marker cleared after restart');
  });
});
