/**
 * EventEmitter - 简单的事件发布/订阅系统
 * 用于解耦状态变更和 UI 更新
 */
class EventEmitter {
  constructor() {
    this._events = new Map();
    // 用于 once：存储原始 callback 到 wrapper 的映射
    this._onceMap = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  on(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(callback);

    // 返回取消订阅的函数
    return () => this.off(event, callback);
  }

  /**
   * 发布事件
   * @param {string} event - 事件名
   * @param {*} data - 事件数据
   * @returns {boolean} 总是返回 true
   */
  emit(event, data) {
    const callbacks = this._events.get(event);
    if (!callbacks || callbacks.length === 0) {
      return true;
    }

    // 复制数组以防止回调过程中修改数组
    const callbacksCopy = callbacks.slice();
    for (const callback of callbacksCopy) {
      try {
        callback(data);
      } catch (error) {
        // 回调函数内的错误不应阻断其他订阅者
        console.error(`Error in event handler for "${event}":`, error);
      }
    }

    return true;
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名
   * @param {Function} [callback] - 回调函数（可选，不提供则取消该事件所有订阅）
   * @returns {boolean} 总是返回 true
   */
  off(event, callback) {
    if (!callback) {
      // 无回调参数，取消该事件所有订阅
      this._events.delete(event);
      // 同时清理 onceMap 中相关的条目
      for (const [origCb, wrapper] of this._onceMap) {
        this.off(event, wrapper);
      }
      return true;
    }

    const callbacks = this._events.get(event);
    if (!callbacks) {
      return true;
    }

    // 检查是否是 once 的原始 callback，若是则也移除 wrapper
    if (this._onceMap.has(callback)) {
      const wrapper = this._onceMap.get(callback);
      this._onceMap.delete(callback);
      // 移除 wrapper
      const wrapperIndex = callbacks.indexOf(wrapper);
      if (wrapperIndex !== -1) {
        callbacks.splice(wrapperIndex, 1);
      }
    }

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // 如果事件没有订阅者了，清理该事件
    if (callbacks.length === 0) {
      this._events.delete(event);
    }

    return true;
  }

  /**
   * 单次订阅 - 回调触发后自动取消订阅
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (data) => {
      // 触发后从 onceMap 中移除
      this._onceMap.delete(callback);
      this.off(event, wrapper);
      callback(data);
    };
    // 建立原始 callback 到 wrapper 的映射
    this._onceMap.set(callback, wrapper);
    this.on(event, wrapper);
  }
}
