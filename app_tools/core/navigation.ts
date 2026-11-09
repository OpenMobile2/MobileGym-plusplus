import { ToolExecutionError } from './errors';

const NAVIGATION_TIMEOUT_MS = 3000;

export async function waitForUiPaint(frames = 2): Promise<void> {
  for (let frame = 0; frame < frames; frame += 1) {
    await new Promise<void>((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }
      window.setTimeout(resolve, 0);
    });
  }
}

export async function openAppRoute(appId: string, route: string): Promise<void> {
  const os = window.__OS__;
  if (!os) {
    throw new ToolExecutionError('ENVIRONMENT_NOT_READY', 'The simulated OS is not ready.');
  }
  os.openApp(appId, route);

  const start = performance.now();
  while (performance.now() - start < NAVIGATION_TIMEOUT_MS) {
    if (os.getAppRoute(appId)?.path === route) {
      await waitForUiPaint();
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 16));
  }
  throw new ToolExecutionError(
    'NAVIGATION_TIMEOUT',
    `${appId} did not reach route "${route}" within ${NAVIGATION_TIMEOUT_MS}ms.`,
  );
}
