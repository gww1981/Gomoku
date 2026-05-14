/**
 * EventEmitter 单元测试
 */
QUnit.module('EventEmitter', function() {

  QUnit.test('on and emit should work with single subscriber', function(assert) {
    const emitter = new EventEmitter();
    let called = false;
    let receivedData = null;

    emitter.on('test', function(data) {
      called = true;
      receivedData = data;
    });

    emitter.emit('test', { value: 42 });

    assert.ok(called, 'Callback was invoked');
    assert.equal(receivedData.value, 42, 'Data was passed correctly');
  });

  QUnit.test('emit should support multiple subscribers', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.on('event', function() { count++; });
    emitter.on('event', function() { count++; });
    emitter.on('event', function() { count++; });

    emitter.emit('event');

    assert.equal(count, 3, 'All three subscribers were called');
  });

  QUnit.test('off should remove specific subscriber', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    function handler() { count++; }
    emitter.on('event', handler);
    emitter.on('event', function() { count++; });

    emitter.off('event', handler);
    emitter.emit('event');

    assert.equal(count, 1, 'Only the non-removed subscriber was called');
  });

  QUnit.test('off without callback should remove all subscribers for event', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.on('event', function() { count++; });
    emitter.on('event', function() { count++; });

    emitter.off('event');
    emitter.emit('event');

    assert.equal(count, 0, 'No subscribers were called');
  });

  QUnit.test('once should only fire once', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.once('event', function() { count++; });
    emitter.emit('event');
    emitter.emit('event');
    emitter.emit('event');

    assert.equal(count, 1, 'Callback was called only once');
  });

  QUnit.test('once subscriber can be removed via off', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    function handler() { count++; }
    emitter.once('event', handler);
    emitter.off('event', handler);
    emitter.emit('event');

    assert.equal(count, 0, 'Once callback was not called after off');
  });

  QUnit.test('error in one subscriber should not stop others', function(assert) {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.on('event', function() {
      throw new Error('Intentional error');
    });
    emitter.on('event', function() { count++; });
    emitter.on('event', function() { count++; });

    emitter.emit('event');

    assert.equal(count, 2, 'Other subscribers still received the event');
  });

  QUnit.test('emit with no subscribers should not throw', function(assert) {
    const emitter = new EventEmitter();

    assert.ok(emitter.emit('nonexistent'), 'emit returns true even with no subscribers');
  });

  QUnit.test('different events should be independent', function(assert) {
    const emitter = new EventEmitter();
    let eventA = 0;
    let eventB = 0;

    emitter.on('eventA', function() { eventA++; });
    emitter.on('eventB', function() { eventB++; });

    emitter.emit('eventA');
    emitter.emit('eventA');
    emitter.emit('eventB');

    assert.equal(eventA, 2, 'eventA fired twice');
    assert.equal(eventB, 1, 'eventB fired once');
  });

  QUnit.test('off with unknown event should not throw', function(assert) {
    const emitter = new EventEmitter();

    assert.ok(emitter.off('nonexistent'), 'off returns true even with unknown event');
  });

});
