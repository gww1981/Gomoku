/**
 * AudioManager 单元测试
 * TDD RED 阶段：这些测试应该失败，因为 AudioManager 还未实现
 */

QUnit.module('AudioManager', function() {

  QUnit.test('AudioManager should exist as a class', function(assert) {
    assert.equal(typeof AudioManager, 'function', 'AudioManager should be a function');
  });

  QUnit.test('should have 5 preset tracks', function(assert) {
    const am = new AudioManager();
    const presets = Object.keys(am.PRESET_MUSIC);
    assert.equal(presets.length, 5, 'Should have 5 preset tracks');
    assert.ok(am.PRESET_MUSIC['preset-1'], 'preset-1 should exist');
    assert.ok(am.PRESET_MUSIC['preset-2'], 'preset-2 should exist');
    assert.ok(am.PRESET_MUSIC['preset-3'], 'preset-3 should exist');
    assert.ok(am.PRESET_MUSIC['preset-4'], 'preset-4 should exist');
    assert.ok(am.PRESET_MUSIC['preset-5'], 'preset-5 should exist');
  });

  QUnit.test('play() should set currentTrack', function(assert) {
    const am = new AudioManager();
    am.play('preset-1');
    assert.equal(am.currentTrack, 'preset-1', 'currentTrack should be preset-1');
  });

  QUnit.test('setVolume() should clamp value between 0 and 1', function(assert) {
    const am = new AudioManager();
    am.setVolume(1.5);
    assert.equal(am.getVolume(), 1, 'Volume should be clamped to 1');
    am.setVolume(-0.5);
    assert.equal(am.getVolume(), 0, 'Volume should be clamped to 0');
    am.setVolume(0.5);
    assert.equal(am.getVolume(), 0.5, 'Volume should be 0.5');
  });

  QUnit.test('toggleMute() should toggle muted state', function(assert) {
    const am = new AudioManager();
    am.audio.muted = false;
    const result = am.toggleMute();
    assert.equal(am.audio.muted, true, 'Should be muted after toggle');
    assert.equal(result, true, 'toggleMute should return new muted state');
  });

  QUnit.test('prev() should cycle to last preset', function(assert) {
    const am = new AudioManager();
    am.play('preset-1');
    am.prev();
    assert.equal(am.currentTrack, 'preset-5', 'Should cycle to preset-5');
  });

  QUnit.test('next() should cycle to first preset', function(assert) {
    const am = new AudioManager();
    am.play('preset-5');
    am.next();
    assert.equal(am.currentTrack, 'preset-1', 'Should cycle to preset-1');
  });

  QUnit.test('getCurrentTrackName() should return correct name', function(assert) {
    const am = new AudioManager();
    assert.equal(am.getCurrentTrackName(), '未选择', 'Should return 未选择 when no track selected');
    am.play('preset-1');
    assert.equal(am.getCurrentTrackName(), '宁静森林', 'Should return preset name');
  });

  QUnit.test('loadCustomMusic() should reject files > 10MB', async function(assert) {
    const am = new AudioManager();
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.mp3', { type: 'audio/mpeg' });

    let errorThrown = false;
    try {
      await am.loadCustomMusic(largeFile);
    } catch (e) {
      errorThrown = true;
      assert.equal(e.message, '文件大小不能超过 10MB', 'Should reject files > 10MB');
    }
    assert.ok(errorThrown, 'Should throw error for large file');
  });
});