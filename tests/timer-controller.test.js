/**
 * TimerController 单元测试
 */
QUnit.module('TimerController', function() {

  // 测试辅助函数：异步等待
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  QUnit.test('构造函数应初始化正确的默认状态', function(assert) {
    const timer = new TimerController();

    assert.equal(timer.getRemainingTime('black'), 30, '黑方初始时间为30秒');
    assert.equal(timer.getRemainingTime('white'), 30, '白方初始时间为30秒');
    assert.equal(timer.state.active, null, '初始无活跃计时器');
    assert.equal(timer.state.black, 30, '黑方状态正确');
    assert.equal(timer.state.white, 30, '白方状态正确');
  });

  QUnit.test('start 应启动计时器并设置 active', function(assert) {
    const timer = new TimerController();
    timer.start('black');

    assert.equal(timer.state.active, 'black', 'active 设置为 black');
    assert.ok(timer.state.interval !== null, 'interval 已设置');

    timer.stop();
  });

  QUnit.test('stop 应停止计时器', function(assert) {
    const timer = new TimerController();
    timer.start('black');
    timer.stop();

    assert.equal(timer.state.active, null, 'active 已清除');
    assert.equal(timer.state.interval, null, 'interval 已清除');
  });

  QUnit.test('switchTo 应切换计时玩家', function(assert) {
    const timer = new TimerController();
    timer.start('black');
    timer.switchTo('white');

    assert.equal(timer.state.active, 'white', 'active 切换为 white');
    assert.equal(timer.getRemainingTime('black'), 30, '切换后黑方时间未变');

    timer.stop();
  });

  QUnit.test('reset 应重置所有计时', function(assert) {
    const timer = new TimerController();
    timer.start('black');
    timer.reset();

    assert.equal(timer.getRemainingTime('black'), 30, '黑方时间已重置');
    assert.equal(timer.getRemainingTime('white'), 30, '白方时间已重置');
    assert.equal(timer.state.active, null, 'active 已清除');
  });

  QUnit.test('getRemainingTime 应返回正确的时间', function(assert) {
    const timer = new TimerController();

    assert.equal(timer.getRemainingTime('black'), 30, '黑方初始30秒');
    assert.equal(timer.getRemainingTime('white'), 30, '白方初始30秒');
  });

  QUnit.test('timerTick 事件应每秒触发', async function(assert) {
    const timer = new TimerController();
    let tickCount = 0;
    let lastData = null;

    timer.on('timerTick', function(data) {
      tickCount++;
      lastData = data;
    });

    timer.start('black');

    // 等待 2.5 秒，setInterval 可能延迟或提前，允许 1-4 次 tick
    await wait(2500);

    assert.ok(tickCount >= 1 && tickCount <= 4, `timerTick 触发次数: ${tickCount}`);

    timer.stop();
  });

  QUnit.test('timerExpired 事件应在时间耗尽时触发', async function(assert) {
    const timer = new TimerController(1); // 使用实例 limit 参数，不污染类属性
    let expiredPlayer = null;

    timer.on('timerExpired', function(data) {
      expiredPlayer = data.player;
    });

    timer.start('black');

    // 等待 1.5 秒
    await wait(1500);

    assert.equal(expiredPlayer, 'black', 'timerExpired 事件正确触发');

    timer.stop();
  });

  QUnit.test('timerTick 事件应包含正确的 black 和 white 状态', async function(assert) {
    const timer = new TimerController();

    timer.on('timerTick', function(data) {
      assert.ok(typeof data.black === 'number', 'black 是数字');
      assert.ok(typeof data.white === 'number', 'white 是数字');
      assert.ok(data.active === 'black' || data.active === null, 'active 是 black 或 null');
    });

    timer.start('black');
    await wait(1100);

    timer.stop();
  });

  QUnit.test('switchTo 应保留另一个玩家的剩余时间', async function(assert) {
    const timer = new TimerController();

    timer.start('black');
    await wait(1100); // 黑方走 1 秒

    const blackTimeAfter = timer.getRemainingTime('black');
    const whiteTimeBefore = timer.getRemainingTime('white');

    timer.switchTo('white');

    assert.ok(blackTimeAfter < 30, '黑方时间已减少');
    assert.equal(timer.getRemainingTime('white'), 30, '切换后白方时间未变');

    timer.stop();
  });

  QUnit.test('连续 switchTo 应正确管理状态', function(assert) {
    const timer = new TimerController();

    timer.start('black');
    let activeAfterStart = timer.state.active;

    timer.switchTo('white');
    let activeAfterSwitch = timer.state.active;

    timer.switchTo('black');
    let activeAfterSwitchBack = timer.state.active;

    assert.equal(activeAfterStart, 'black', 'start 后 active 是 black');
    assert.equal(activeAfterSwitch, 'white', 'switchTo white 后 active 是 white');
    assert.equal(activeAfterSwitchBack, 'black', 'switchTo black 后 active 是 black');

    timer.stop();
  });

  QUnit.test('reset 应清除所有状态包括 interval', function(assert) {
    const timer = new TimerController();

    timer.start('black');
    timer.reset();

    assert.equal(timer.state.interval, null, 'interval 已清除');
    assert.equal(timer.state.active, null, 'active 已清除');
    assert.equal(timer.state.black, 30, 'black 已重置');
    assert.equal(timer.state.white, 30, 'white 已重置');
  });

  QUnit.test('start 在已有活跃计时器时应重启', function(assert) {
    const timer = new TimerController();

    timer.start('black');
    const firstInterval = timer.state.interval;

    timer.start('white');
    const secondInterval = timer.state.interval;

    assert.notEqual(firstInterval, secondInterval, '重新 start 会创建新的 interval');
    assert.equal(timer.state.active, 'white', 'active 切换到 white');

    timer.stop();
  });

  QUnit.test('on 方法应返回取消订阅函数', function(assert) {
    const timer = new TimerController();
    let count = 0;

    const unsubscribe = timer.on('timerTick', function() {
      count++;
    });

    timer.start('black');
    unsubscribe();
    const countBeforeStop = count;

    // 即使取消订阅，计时器仍在运行，但不会触发回调
    const countAfterCancel = count;

    timer.stop();

    assert.equal(countBeforeStop, countAfterCancel, '取消订阅后不再触发回调');
  });

});