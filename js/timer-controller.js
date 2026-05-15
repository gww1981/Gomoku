/**
 * TimerController - 独立定时器模块
 * 继承 EventEmitter，提供计时器功能
 */

// 计时器常量：30秒
TimerController.TIMER_LIMIT = 30;

/**
 * TimerController 构造函数
 * @param {number} [limit] - 可选的计时器限制，默认 TIMER_LIMIT
 */
function TimerController(limit) {
  EventEmitter.call(this);
  this.limit = limit || TimerController.TIMER_LIMIT;

  this.state = {
    black: this.limit,
    white: this.limit,
    active: null, // 'black' | 'white' | null
    interval: null // setInterval ID
  };
}

TimerController.prototype = Object.create(EventEmitter.prototype);
TimerController.prototype.constructor = TimerController;

/**
 * 开始计时
 * @param {string} player - 玩家 'black' | 'white'
 */
TimerController.prototype.start = function(player) {
  var self = this;

  // 如果已有活跃计时器，先停止
  if (this.state.interval) {
    clearInterval(this.state.interval);
  }

  // 每次切换到该玩家回合，都应重置为完整步时
  this.state[player] = this.limit;
  this.state.active = player;

  // 清除之前的 interval
  if (this.state.interval) {
    clearInterval(this.state.interval);
  }

  this.state.interval = setInterval(function() {
    self.state[player]--;

    // 触发 timerTick 事件
    self.emit('timerTick', {
      black: self.state.black,
      white: self.state.white,
      active: self.state.active
    });

    // 检查超时
    if (self.state[player] <= 0) {
      clearInterval(self.state.interval);
      self.state.interval = null;
      self.state.active = null;

      // 触发 timerExpired 事件
      self.emit('timerExpired', { player: player });
    }
  }, 1000);
};

/**
 * 停止计时
 */
TimerController.prototype.stop = function() {
  if (this.state.interval) {
    clearInterval(this.state.interval);
    this.state.interval = null;
  }
  this.state.active = null;
};

/**
 * 切换计时玩家
 * @param {string} player - 玩家 'black' | 'white'
 */
TimerController.prototype.switchTo = function(player) {
  this.stop();
  this.start(player);
};

/**
 * 获取剩余时间
 * @param {string} player - 玩家 'black' | 'white'
 * @returns {number} 剩余秒数
 */
TimerController.prototype.getRemainingTime = function(player) {
  return this.state[player];
};

/**
 * 重置所有计时
 */
TimerController.prototype.reset = function() {
  this.stop();
  this.state.black = this.limit;
  this.state.white = this.limit;
};

// 导出 TimerController（支持 CommonJS 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimerController;
}
