import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildEvent, isTelemetryEvent, isTelemetrySnapshot, type IngestBatch } from '@shared';
import { createMemoryEngine, createRepository, type Repository } from '../repository';
import { beaconFlush, emit, flush, notifyProjectChange, start, stop } from './index';

const nowIso = (): string => new Date().toISOString();

const okResponse = (): Response =>
  new Response('{"ok":true,"accepted":{"events":1,"snapshots":0}}', { status: 200 });

function eventBody(callIndex: number): IngestBatch {
  const call = fetchMock.mock.calls[callIndex];
  return JSON.parse(String((call[1] as RequestInit).body)) as IngestBatch;
}

let fetchMock: ReturnType<typeof vi.fn>;
let sendBeaconMock: ReturnType<typeof vi.fn>;
let fakeWindow: EventTarget;

function setupRepo(): Repository {
  return createRepository(createMemoryEngine());
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-17T10:00:00.000Z'));
  fetchMock = vi.fn(async () => okResponse());
  sendBeaconMock = vi.fn(() => true);
  fakeWindow = new EventTarget();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('navigator', { onLine: true, sendBeacon: sendBeaconMock });
  vi.stubGlobal('window', fakeWindow);
});

afterEach(() => {
  stop();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('ONLINE_FLUSH', () => {
  it('queues app_opened at start and flushes a wire batch that empties the queue on 2xx', async () => {
    const repo = setupRepo();
    start(repo);

    const opened = repo.getTelemetryQueue().filter(isTelemetryEvent)[0];
    expect(opened.name).toBe('app_opened');

    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ingest');
    expect(init.method).toBe('POST');

    const batch = eventBody(0);
    expect(batch.schemaVersion).toBe(1);
    expect(batch.deviceId).toBe(repo.ensureDeviceId());
    expect(batch.events).toHaveLength(1);
    expect(batch.events[0].name).toBe('app_opened');
    expect(repo.getTelemetryQueue()).toEqual([]);
  });

  it('never repeats the deviceId across restarts', async () => {
    const engine = createMemoryEngine();
    const first = createRepository(engine);
    start(first);
    const deviceId = first.ensureDeviceId();
    await flush();
    stop();

    const second = createRepository(engine);
    start(second);
    await flush();

    expect(eventBody(1).deviceId).toBe(deviceId);
    expect(eventBody(0).deviceId).toBe(eventBody(1).deviceId);
  });
});

describe('OFFLINE_QUEUE', () => {
  it('accumulates items without any network attempt while offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const repo = setupRepo();
    start(repo);
    emit('product_created', { productId: 'p-1', category: 'other' });

    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(repo.getTelemetryQueue()).toHaveLength(2);
  });
});

describe('KILL_SWITCH', () => {
  it('makes zero ingest attempts while queueing quietly, and flushes normally once unset', async () => {
    vi.stubEnv('VITE_TELEMETRY_DISABLED', 'true');
    const repo = setupRepo();
    start(repo);
    emit('product_created', { productId: 'p-1' });

    await flush();
    beaconFlush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(repo.getTelemetryQueue()).toHaveLength(2);

    vi.stubEnv('VITE_TELEMETRY_DISABLED', 'false');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(repo.getTelemetryQueue()).toEqual([]);
  });
});

describe('RATE_LIMITED stays retryable with backoff', () => {
  it('keeps the queue, blocks immediate retries and retries after the backoff window', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":{"code":"rate_limited"}}', { status: 429 }));
    const repo = setupRepo();
    start(repo);

    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(repo.getTelemetryQueue()).toHaveLength(1);

    await flush(); // still inside the 1-minute backoff window
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(Date.now() + 61_000));
    fetchMock.mockResolvedValue(okResponse());
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(repo.getTelemetryQueue()).toEqual([]);
  });
});

describe('FORBIDDEN_FIELDS / IMPLAUSIBLE batches stay on disk but are suppressed for the session', () => {
  it('stops resending the rejected batch while later, different items still flush', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"error":{"code":"forbidden_field","message":"no"}}', { status: 400 })
    );
    const repo = setupRepo();
    start(repo);

    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(repo.getTelemetryQueue()).toHaveLength(1);

    await flush(); // everything queued is suppressed → no network call
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(repo.getTelemetryQueue()).toHaveLength(1);

    fetchMock.mockResolvedValue(okResponse());
    emit('product_created', { productId: 'p-2' });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const batch = eventBody(1);
    expect(batch.events.map((event) => event.name)).toEqual(['product_created']);
    // The suppressed item is still on disk, waiting for a later session (C12).
    expect(repo.getTelemetryQueue()).toHaveLength(1);
  });
});

describe('PAGE_HIDE beacon', () => {
  it('fires a Blob beacon and keeps the queue intact', () => {
    const repo = setupRepo();
    start(repo);

    beaconFlush();

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, payload] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe('/api/ingest');
    expect(payload).toBeInstanceOf(Blob);
    expect(repo.getTelemetryQueue()).toHaveLength(1);
  });
});

describe('snapshot throttling (decided: <=1 per project per 60s plus session start)', () => {
  it('captures the session snapshot, throttles changes, and captures again after the window', () => {
    const repo = setupRepo();
    const project = repo.load().projects[0];
    start(repo);

    notifyProjectChange(project);
    notifyProjectChange(project);
    notifyProjectChange(project);

    const snapshots = () => repo.getTelemetryQueue().filter(isTelemetrySnapshot);
    expect(snapshots()).toHaveLength(1);
    expect(snapshots()[0].projectId).toBe(project.id);

    vi.setSystemTime(new Date(Date.now() + 61_000));
    notifyProjectChange(project);
    expect(snapshots()).toHaveLength(2);
  });
});

describe('oversized queues', () => {
  it('flushes in chunks that respect the shared caps', async () => {
    const repo = setupRepo();
    start(repo);
    repo.saveTelemetryQueue(
      Array.from({ length: 501 }, (_, i) =>
        buildEvent('product_created', { productId: `p-${i}` }, nowIso())
      )
    );

    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(eventBody(0).events).toHaveLength(500);
    expect(eventBody(1).events).toHaveLength(1);
    expect(repo.getTelemetryQueue()).toEqual([]);
  });
});

describe('lifecycle triggers (cadence timer and online listener)', () => {
  it('advancing timer by 60s flushes automatically', async () => {
    const repo = setupRepo();
    start(repo);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(repo.getTelemetryQueue()).toEqual([]);
  });

  it('firing online event flushes automatically', async () => {
    const repo = setupRepo();
    start(repo);
    expect(fetchMock).not.toHaveBeenCalled();

    fakeWindow.dispatchEvent(new Event('online'));
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(repo.getTelemetryQueue()).toEqual([]);
    });
  });
});

