import { describe, expect, it } from 'vitest';
import { HealthTracker } from './health-tracker.js';

describe('HealthTracker', () => {
  it('reports healthy with no data', () => {
    const tracker = new HealthTracker();
    const status = tracker.getStatus('openai');
    expect(status.healthy).toBe(true);
    expect(status.successRate).toBe(1);
    expect(status.totalRequests).toBe(0);
  });

  it('reports healthy when all requests succeed', () => {
    const tracker = new HealthTracker();
    tracker.record('openai', true);
    tracker.record('openai', true);
    tracker.record('openai', true);
    const status = tracker.getStatus('openai');
    expect(status.healthy).toBe(true);
    expect(status.successRate).toBe(1);
    expect(status.totalRequests).toBe(3);
  });

  it('reports unhealthy when failure rate exceeds threshold', () => {
    const tracker = new HealthTracker({ failureThreshold: 0.5 });
    tracker.record('openai', false);
    tracker.record('openai', false);
    tracker.record('openai', false);
    tracker.record('openai', true);
    // 75% failure rate >= 50% threshold
    const status = tracker.getStatus('openai');
    expect(status.healthy).toBe(false);
    expect(status.successRate).toBe(0.25);
  });

  it('reports healthy when failure rate is below threshold', () => {
    const tracker = new HealthTracker({ failureThreshold: 0.5 });
    tracker.record('anthropic', true);
    tracker.record('anthropic', true);
    tracker.record('anthropic', false);
    // 33% failure rate < 50% threshold
    const status = tracker.getStatus('anthropic');
    expect(status.healthy).toBe(true);
  });

  it('respects window size — old entries expire', () => {
    let time = 1000;
    const tracker = new HealthTracker({ windowSizeMs: 100 }, () => time);

    tracker.record('openai', false);
    tracker.record('openai', false);

    // Advance time past the window
    time = 1200;
    tracker.record('openai', true);

    const status = tracker.getStatus('openai');
    // Only the recent success is in the window
    expect(status.totalRequests).toBe(1);
    expect(status.successRate).toBe(1);
    expect(status.healthy).toBe(true);
  });

  it('trims to max window entries', () => {
    const tracker = new HealthTracker({ maxWindowEntries: 3 });
    tracker.record('openai', false);
    tracker.record('openai', false);
    tracker.record('openai', false);
    tracker.record('openai', true);
    tracker.record('openai', true);
    tracker.record('openai', true);

    const status = tracker.getStatus('openai');
    // Only last 3 entries kept (all successes)
    expect(status.totalRequests).toBe(3);
    expect(status.successRate).toBe(1);
  });

  it('tracks providers independently', () => {
    const tracker = new HealthTracker();
    tracker.record('openai', false);
    tracker.record('anthropic', true);

    expect(tracker.getStatus('openai').successRate).toBe(0);
    expect(tracker.getStatus('anthropic').successRate).toBe(1);
  });

  it('resets a specific provider', () => {
    const tracker = new HealthTracker();
    tracker.record('openai', false);
    tracker.record('anthropic', false);

    tracker.reset('openai');

    expect(tracker.getStatus('openai').totalRequests).toBe(0);
    expect(tracker.getStatus('anthropic').totalRequests).toBe(1);
  });

  it('resets all providers', () => {
    const tracker = new HealthTracker();
    tracker.record('openai', false);
    tracker.record('anthropic', false);

    tracker.reset();

    expect(tracker.getStatus('openai').totalRequests).toBe(0);
    expect(tracker.getStatus('anthropic').totalRequests).toBe(0);
  });

  it('getAllStatuses returns all tracked providers', () => {
    const tracker = new HealthTracker();
    tracker.record('openai', true);
    tracker.record('anthropic', false);

    const statuses = tracker.getAllStatuses();
    expect(statuses.size).toBe(2);
    expect(statuses.get('openai')?.healthy).toBe(true);
    expect(statuses.get('anthropic')?.healthy).toBe(false);
  });

  it('reports unhealthy when failureRate exactly equals threshold', () => {
    const tracker = new HealthTracker({ failureThreshold: 0.5 });
    tracker.record('openai', false);
    tracker.record('openai', true);
    // 50% failure rate === 50% threshold → failureRate < threshold is false → unhealthy
    const status = tracker.getStatus('openai');
    expect(status.healthy).toBe(false);
    expect(status.successRate).toBe(0.5);
  });

  it('returns healthy when all entries are outside window', () => {
    let time = 1000;
    const tracker = new HealthTracker({ windowSizeMs: 100 }, () => time);

    tracker.record('openai', false);
    time = 1200;

    const status = tracker.getStatus('openai');
    expect(status.healthy).toBe(true);
    expect(status.totalRequests).toBe(0);
  });
});
