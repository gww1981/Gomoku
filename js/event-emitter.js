/**
 * EventEmitter - 简单的事件发布/订阅系统
 * 用于解耦状态变更和 UI 更新
 */

function EventEmitter() {
  this._events = new Map();
  this._onceMap = new Map();
}

/**
 * 订阅事件
 * @param {string} event - 事件名
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消订阅的函数
 */
EventEmitter.prototype.on = function(event, callback) {
  if (!this._events.has(event)) {
    this._events.set(event, []);
  }
  this._events.get(event).push(callback);

  // 返回取消订阅的函数
  var self = this;
  return function() {
    self.off(event, callback);
  };
};

/**
 * 发布事件
 * @param {string} event - 事件名
 * @param {*} data - 事件数据
 * @returns {boolean} 总是返回 true
 */
EventEmitter.prototype.emit = function(event, data) {
  var callbacks = this._events.get(event);
  if (!callbacks || callbacks.length === 0) {
    return true;
  }

  // 复制数组以防止回调过程中修改数组
  var callbacksCopy = callbacks.slice();
  for (var i = 0; i < callbacksCopy.length; i++) {
    try {
      callbacksCopy[i](data);
    } catch (error) {
      // 回调函数内的错误不应阻断其他订阅者
      console.error('Error in event handler for "' + event + '":', error);
    }
  }

  return true;
};

/**
 * 取消订阅
 * @param {string} event - 事件名
 * @param {Function} [callback] - 回调函数（可选，不提供则取消该事件所有订阅）
 * @returns {boolean} 总是返回 true
 */
EventEmitter.prototype.off = function(event, callback) {
  if (!callback) {
    // 无回调参数，取消该事件所有订阅
    this._events.delete(event);
    // 同时清理 onceMap 中相关的条目
    for (var key of this._onceMap.keys()) {
      this.off(event, this._onceMap.get(key));
    }
    return true;
  }

  var callbacks = this._events.get(event);
  if (!callbacks) {
    return true;
  }

  // 检查是否是 once 的原始 callback，若是则也移除 wrapper
  if (this._onceMap.has(callback)) {
    var wrapper = this._onceMap.get(callback);
    this._onceMap.delete(callback);
    // 移除 wrapper
    var wrapperIndex = callbacks.indexOf(wrapper);
    if (wrapperIndex !== -1) {
      callbacks.splice(wrapperIndex, 1);
    }
  }

  var index = callbacks.indexOf(callback);
  if (index !== -1) {
    callbacks.splice(index, 1);
  }

  // 如果事件没有订阅者了，清理该事件
  if (callbacks.length === 0) {
    this._events.delete(event);
  }

  return true;
};

/**
 * 单次订阅 - 回调触发后自动取消订阅
 * @param {string} event - 事件名
 * @param {Function} callback - 回调函数
 */
EventEmitter.prototype.once = function(event, callback) {
  var self = this;
  var wrapper = function(data) {
    // 触发后从 onceMap 中移除
    self._onceMap.delete(callback);
    self.off(event, wrapper);
    callback(data);
  };
  // 建立原始 callback 到 wrapper 的映射
  this._onceMap.set(callback, wrapper);
  this.on(event, wrapper);
};

// 导出 EventEmitter（支持 CommonJS 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventEmitter;
}
