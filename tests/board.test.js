/**
 * Board 类单元测试
 */
QUnit.module('Board', function() {

  QUnit.test('undoMove should clear stone and revert state', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    assert.equal(board.grid[7][7], 1, 'Stone at (7,7)');
    assert.equal(board.currentPlayer, 2, 'currentPlayer = 2');
    assert.equal(board.moveCount, 1, 'moveCount = 1');

    board.undoMove(7, 7);
    assert.equal(board.grid[7][7], 0, 'Stone removed');
    assert.equal(board.currentPlayer, 1, 'currentPlayer reverted to 1');
    assert.equal(board.moveCount, 0, 'moveCount = 0');
  });

  QUnit.test('undoMove should revert correctly with multiple moves', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.placeStone(7, 8, 2);
    board.placeStone(8, 7, 1);
    assert.equal(board.moveCount, 3);

    board.undoMove(8, 7);
    assert.equal(board.grid[8][7], 0);
    assert.equal(board.currentPlayer, 1, 'currentPlayer reverted to 1 after undoing black stone');
    assert.equal(board.moveCount, 2);

    board.undoMove(7, 8);
    assert.equal(board.currentPlayer, 2, 'currentPlayer reverted to 2 after undoing white stone');
    assert.equal(board.moveCount, 1);
  });

  QUnit.test('undoMove on empty cell should not change state', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const prevCount = board.moveCount;
    const prevPlayer = board.currentPlayer;

    board.undoMove(3, 3);
    assert.equal(board.moveCount, prevCount);
    assert.equal(board.currentPlayer, prevPlayer);
    assert.equal(board.grid[3][3], 0);
  });

});
