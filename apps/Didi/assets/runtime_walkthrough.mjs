// DiDi Gate 4 runtime walkthrough.
// Run while Vite is serving the simulator:
//   DIDI_URL=http://127.0.0.1:5193 node apps/Didi/assets/runtime_walkthrough.mjs
import puppeteer from 'puppeteer';

const URL = process.env.DIDI_URL || 'http://127.0.0.1:5193';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const results = [];
const runtimeErrors = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const count = (page, selector) => page.$$eval(selector, (nodes) => nodes.length);

async function clickAt(page, selector, index = 0) {
  const nodes = await page.$$(selector);
  if (nodes.length <= index) throw new Error(`${selector}: expected index ${index}, count=${nodes.length}`);
  await nodes[index].click();
  await sleep(120);
}

async function state(page, expression) {
  return page.evaluate((expr) => {
    const app = window.__SIM__.getState().apps.didi;
    return Function('app', `return (${expr})`)(app);
  }, expression);
}

async function back(page) {
  await page.evaluate(() => window.__OS__.handleBack());
  await sleep(120);
}

async function signature(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-adjust-resize]') || document.body;
    return (root.innerText || '').replace(/\s+/g, '').slice(0, 90);
  });
}

async function pinchMap(page, selector, startRadius, endRadius) {
  const surface = await page.$(selector);
  const box = await surface?.boundingBox();
  if (!box) throw new Error(`${selector}: pinch surface bounds missing`);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height * 0.44;
  const session = await page.createCDPSession();
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  const points = (radius) => [
    { x: centerX - radius, y: centerY, radiusX: 5, radiusY: 5, force: 1, id: 1 },
    { x: centerX + radius, y: centerY, radiusX: 5, radiusY: 5, force: 1, id: 2 },
  ];
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: points(startRadius),
  });
  for (let step = 1; step <= 8; step += 1) {
    const radius = startRadius + ((endRadius - startRadius) * step) / 8;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: points(radius),
    });
    await sleep(35);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

async function dragMap(page, selector, deltaX, deltaY) {
  await page.waitForSelector(selector, { timeout: 5000 });
  const surface = await page.$(selector);
  const box = await surface?.boundingBox();
  if (!box) throw new Error(`${selector}: drag surface bounds missing`);
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height * 0.44;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 8 });
  await page.mouse.up();
  await sleep(750);
}

async function mapCenter(page) {
  await page.waitForSelector('[data-testid="didi-google-map"]', { timeout: 5000 });
  return page.$eval('[data-testid="didi-google-map"]', (element) => ({
    lat: Number(element.getAttribute('data-map-center-lat')),
    lng: Number(element.getAttribute('data-map-center-lng')),
  }));
}

async function mapViewportMetrics(page) {
  await page.waitForSelector('[data-testid="didi-google-map"]', { timeout: 5000 });
  return page.$eval('[data-testid="didi-google-map"]', (element) => ({
    zoom: Number(element.getAttribute('data-map-zoom')),
    minZoom: Number(element.getAttribute('data-map-min-zoom')),
    maxZoom: Number(element.getAttribute('data-map-max-zoom')),
    visibleSpanMeters: Number(element.getAttribute('data-map-visible-span-meters')),
  }));
}

async function openRidePicker(page) {
  await clickAt(page, 'button[data-trigger="dest.search.open"]', 0);
  await page.waitForSelector('input[data-action="dest.search.input"]');
  // 取「公司」而不是「家」：家就是当前上车点，起终点重合算不出真实路线。
  await clickAt(page, 'button[data-trigger="car.select.open"]', 1);
  await page.waitForSelector('button[data-trigger="call.waiting.open"]');
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${String(error).slice(0, 180)}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !text.includes('[WMR]') && !text.includes('404')) {
      const source = message.location().url;
      runtimeErrors.push(`console: ${text.slice(0, 140)}${source ? ` @ ${source.slice(0, 120)}` : ''}`);
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.__OS__.openApp('didi'));
  await page.waitForSelector('button[data-trigger="home.tab"]');

  const seedCounts = await state(page, '({orders: app.orders.length, messages: app.messageThreads.length, chats: app.driverChats.length, coupons: app.coupons.length})');
  record('launches with diverse seed data', seedCounts.orders >= 5 && seedCounts.messages >= 5 && seedCounts.chats >= 5 && seedCounts.coupons >= 5, JSON.stringify(seedCounts));

  const tabBarHeight = await page.$eval(
    '[data-hide-on-keyboard]',
    (element) => Math.round(element.getBoundingClientRect().height),
  );
  record('DiDi bottom navigation keeps the 52px platform height', tabBarHeight === 52, `${tabBarHeight}px`);
  const unreadBeforeOpen = await state(page, 'app.messageThreads.reduce((sum, thread) => sum + thread.unread, 0)');
  await clickAt(page, 'button[data-trigger="messages.tab"]');
  await sleep(120);
  record(
    'opening message center persists the read state',
    unreadBeforeOpen > 0
      && (await state(page, 'app.messageThreads.reduce((sum, thread) => sum + thread.unread, 0)')) === 0,
  );
  await clickAt(page, 'button[data-action="messages.center.clear"]');
  record(
    'message center clear removes threads from the store',
    (await state(page, 'app.messageThreads.length')) === 0
      && (await count(page, 'button[data-trigger="message.thread.open"]')) === 0,
  );
  await clickAt(page, 'button[data-trigger="home.tab"]');
  await clickAt(page, 'button[data-trigger="home.tab"]');
  const pointerFocus = await page.$eval(
    '[data-app-surface="didi"]',
    (root) => {
      const element = document.querySelector('button[data-trigger="home.tab"]');
      if (!element) return { modality: root.getAttribute('data-focus-modality'), outline: 'missing' };
      const style = getComputedStyle(element);
      return {
        modality: root.getAttribute('data-focus-modality'),
        outline: `${style.outlineStyle}/${style.outlineWidth}`,
      };
    },
  );
  record(
    'pointer focus does not leave a browser outline on the tab bar',
    pointerFocus.modality === 'pointer' && pointerFocus.outline.startsWith('none/'),
    JSON.stringify(pointerFocus),
  );
  await page.keyboard.press('Tab');
  await sleep(120);
  const keyboardFocus = await page.$eval(
    '[data-app-surface="didi"]',
    (root) => {
      const element = document.activeElement;
      const style = element ? getComputedStyle(element) : null;
      return {
        modality: root.getAttribute('data-focus-modality'),
        trigger: element?.getAttribute('data-trigger') ?? '',
        outline: style ? `${style.outlineStyle}/${style.outlineWidth}` : 'missing',
      };
    },
  );
  record(
    'keyboard focus keeps an explicit accessible outline',
    keyboardFocus.modality === 'keyboard'
      && keyboardFocus.outline === 'solid/2px',
    JSON.stringify(keyboardFocus),
  );
  await clickAt(page, 'button[data-trigger="home.tab"]');

  // recH 27–44s: the main home map remains directly manipulable after pickup selection.
  const homeMap = await page.$('[data-testid="didi-home-map"] [data-testid="didi-google-map"]');
  const homeMapBox = await homeMap?.boundingBox();
  record(
    'selected pickup leaves a large directly manipulable home map',
    Boolean(homeMapBox)
      && homeMapBox.height >= 400
      && (await count(page, '[data-testid="didi-home-map"] [data-map-selectable="true"]')) === 1,
    homeMapBox ? `${Math.round(homeMapBox.width)}x${Math.round(homeMapBox.height)}` : 'missing',
  );
  await page.waitForFunction(
    () => Number(
      document.querySelector('[data-testid="didi-home-map"] [data-testid="didi-google-map"]')
        ?.getAttribute('data-map-visible-span-meters'),
    ) > 0,
    { timeout: 5000 },
  );
  const homePickupBeforePan = await state(page, 'app.pickupPoint');
  const homeCenterBeforePan = await mapCenter(page);
  if (!homeMapBox) throw new Error('home map bounds missing');
  const homeDragX = homeMapBox.x + homeMapBox.width / 2;
  const homeDragY = homeMapBox.y + homeMapBox.height * 0.44;
  await page.mouse.move(homeDragX, homeDragY);
  await page.mouse.down();
  await page.mouse.move(homeDragX + 118, homeDragY + 56, { steps: 8 });
  const homeMovingStatusVisible = (await page.evaluate(
    () => document.body.innerText.includes('正在获取上车地点'),
  ));
  await page.mouse.up();
  await sleep(800);
  const homeCenterAfterPan = await mapCenter(page);
  const homePickupAfterPan = await state(page, 'app.pickupPoint');
  record(
    'home map drag shows resolving state and updates the nearby pickup',
    homeMovingStatusVisible
      && homeCenterAfterPan.lng < homeCenterBeforePan.lng
      && homeCenterAfterPan.lat > homeCenterBeforePan.lat
      && homePickupAfterPan !== homePickupBeforePan,
    `${homeCenterBeforePan.lat},${homeCenterBeforePan.lng} -> ${homeCenterAfterPan.lat},${homeCenterAfterPan.lng}; ${homePickupBeforePan} -> ${homePickupAfterPan}`,
  );
  await clickAt(page, 'button[data-action="home.map.locate"]');
  await sleep(700);
  const homeViewportBeforePinch = await mapViewportMetrics(page);
  await pinchMap(page, '[data-testid="didi-home-map"] [data-testid="didi-google-map"]', 22, 72);
  await sleep(950);
  const homeViewportAfterZoomIn = await mapViewportMetrics(page);
  record(
    'home map zoom-in stays inside the complete offline cache',
    homeViewportAfterZoomIn.maxZoom === 17
      && homeViewportAfterZoomIn.zoom === homeViewportAfterZoomIn.maxZoom,
    `zoom=${homeViewportAfterZoomIn.zoom}, max=${homeViewportAfterZoomIn.maxZoom}`,
  );
  await pinchMap(page, '[data-testid="didi-home-map"] [data-testid="didi-google-map"]', 72, 22);
  await sleep(950);
  const homeViewportAfterPinch = await mapViewportMetrics(page);
  record(
    'home map accepts two-finger pinch after pickup selection',
    homeViewportAfterPinch.zoom < homeViewportBeforePinch.zoom
      && homeViewportAfterPinch.visibleSpanMeters > homeViewportBeforePinch.visibleSpanMeters * 2,
    `${homeViewportBeforePinch.zoom}/${homeViewportBeforePinch.visibleSpanMeters}m -> ${homeViewportAfterPinch.zoom}/${homeViewportAfterPinch.visibleSpanMeters}m`,
  );
  await pinchMap(page, '[data-testid="didi-home-map"] [data-testid="didi-google-map"]', 72, 12);
  await sleep(950);
  const homeViewportAfterMinZoomAttempt = await mapViewportMetrics(page);
  record(
    'home map zoom-out stops at the complete offline cache boundary',
    homeViewportAfterMinZoomAttempt.minZoom === 15
      && homeViewportAfterMinZoomAttempt.zoom === homeViewportAfterMinZoomAttempt.minZoom
      && homeViewportAfterMinZoomAttempt.visibleSpanMeters === homeViewportAfterPinch.visibleSpanMeters,
    `zoom=${homeViewportAfterMinZoomAttempt.zoom}, min=${homeViewportAfterMinZoomAttempt.minZoom}, span=${homeViewportAfterMinZoomAttempt.visibleSpanMeters}m`,
  );
  const homeFallbackStyle = await page.$eval(
    '[data-testid="didi-home-map"] [data-testid="didi-google-map"]',
    (element) => {
      const style = getComputedStyle(element);
      return { repeat: style.backgroundRepeat, size: style.backgroundSize };
    },
  );
  record(
    'offline fallback never repeats into a tiled map mosaic',
    homeFallbackStyle.repeat === 'no-repeat' && homeFallbackStyle.size === 'cover',
    `${homeFallbackStyle.repeat}/${homeFallbackStyle.size}`,
  );
  await clickAt(page, 'button[data-action="home.map.locate"]');
  await sleep(700);

  // Shared Maps app snapshot: DiDi searches the same cached POI catalog.
  await clickAt(page, 'button[data-trigger="dest.search.open"]', 0);
  const sharedCatalogSearch = await page.$('input[data-testid="didi-place-search-input"]');
  if (!sharedCatalogSearch) throw new Error('shared catalog search input missing');
  await sharedCatalogSearch.type('餐厅');
  await sleep(360);
  const sharedCatalogMatches = await count(page, '[data-testid^="didi-place-result-gmap_"]');
  record(
    'shared offline Google Maps catalog is searchable',
    sharedCatalogMatches >= 10,
    `${sharedCatalogMatches} cached restaurant matches`,
  );
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await page.waitForSelector('button[data-trigger="dest.search.open"]');

  // P0: destination search -> loading state -> alias match -> recent place -> route estimate.
  await clickAt(page, 'button[data-trigger="dest.search.open"]', 0);
  const destinationSearch = await page.$('input[data-testid="didi-place-search-input"]');
  if (!destinationSearch) throw new Error('destination search input missing');
  await destinationSearch.type('东站');
  await sleep(30);
  const destinationSkeletonVisible = (await count(page, '[aria-label="正在搜索地点"]')) === 1;
  await sleep(360);
  const eastStationResultCount = await count(page, '[data-testid="didi-place-result-poi_yunjiang_east"]');
  record(
    'destination search resolves aliases after loading state',
    destinationSkeletonVisible && eastStationResultCount === 1,
    JSON.stringify({ skeleton: destinationSkeletonVisible, results: eastStationResultCount }),
  );
  await clickAt(page, '[data-testid="didi-place-result-poi_yunjiang_east"]');
  const destinationSelection = await state(
    page,
    '({to: app.trip.to, km: app.trip.distanceKm, recent: app.addresses.filter((item) => item.label === "历史" && item.name === "云江东站").length,'
    + ' routes: app.trip.routeOptions.length, routeKm: app.trip.routeOptions.find((route) => route.id === app.trip.routeId)?.distanceKm,'
    + ' hasCoords: Boolean(app.trip.fromLatLng && app.trip.toLatLng)})',
  );
  record(
    'destination selection estimates from the real road network',
    destinationSelection.to === '云江东站'
      && destinationSelection.hasCoords === true
      && destinationSelection.routes >= 1
      && destinationSelection.km === destinationSelection.routeKm
      && destinationSelection.recent === 1
      && (await count(page, 'button[data-trigger="call.waiting.open"]')) === 1,
    JSON.stringify(destinationSelection),
  );
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await page.waitForSelector('button[data-trigger="dest.search.open"]');

  // P0: search a pickup area, detect nearby pickup points, pan and recenter the map.
  const pickupBeforePan = await state(page, 'app.pickupPoint');
  await clickAt(page, 'button[data-trigger="pickup.confirm.fromHome"]');
  await page.waitForSelector('[data-action="pickup.confirm.pan"]');
  await clickAt(page, 'button[data-trigger="pickup.search.open"]');
  const publicPickupSearch = await page.$('input[data-testid="didi-place-search-input"]');
  if (!publicPickupSearch) throw new Error('public pickup search input missing');
  await publicPickupSearch.type('麦当劳');
  await sleep(330);
  const publicPickupResults = await count(page, '[data-testid^="didi-place-result-gmap_"]');
  await clickAt(page, '[data-testid^="didi-place-result-gmap_"]', 0);
  await sleep(500);
  if ((await count(page, '[data-map-provider="shared-google-offline"]')) !== 1) {
    const failedPickupState = await state(
      page,
      '({target: app.placeSearchTarget, anchor: app.mapAnchorId, selected: app.selectedPickupId})',
    );
    throw new Error(
      `pickup search did not return to map: ${JSON.stringify({
        state: failedPickupState,
        page: await signature(page),
        runtimeErrors,
      })}`,
    );
  }
  record(
    'public cached POI opens a selectable pickup map',
    publicPickupResults >= 5
      && (await state(page, 'app.mapAnchorId')).startsWith('gmap_')
      && (await count(page, '[data-testid^="didi-pickup-option-"]')) === 4,
    `${publicPickupResults} in-radius matches`,
  );
  await clickAt(page, 'button[data-trigger="pickup.search.open"]');
  const pickupSearch = await page.$('input[data-testid="didi-place-search-input"]');
  if (!pickupSearch) throw new Error('pickup search input missing');
  await pickupSearch.type('云江东站');
  await sleep(330);
  await clickAt(page, '[data-testid="didi-place-result-poi_yunjiang_east"]');
  await page.waitForSelector('[data-testid="didi-pickup-option-east_west_ground"]');
  const pickupAreaState = await state(
    page,
    '({anchor: app.mapAnchorId, selected: app.selectedPickupId, pickup: app.pickupPoint})',
  );
  record(
    'pickup search detects official and nearby station points',
    pickupAreaState.anchor === 'poi_yunjiang_east'
      && pickupAreaState.selected === 'east_west_ground'
      && pickupAreaState.pickup.includes('网约车上车点')
      && (await count(page, '[data-testid^="didi-pickup-option-"]')) >= 3,
    JSON.stringify(pickupAreaState),
  );
  const centerBeforeFourWayPan = await mapCenter(page);
  await dragMap(page, '[data-testid="didi-google-map"]', 88, 0);
  const centerAfterDragRight = await mapCenter(page);
  record(
    'holding and dragging the map right moves the viewport west',
    centerAfterDragRight.lng < centerBeforeFourWayPan.lng,
    `${centerBeforeFourWayPan.lng} -> ${centerAfterDragRight.lng}`,
  );
  await clickAt(page, 'button[data-action="pickup.confirm.locate"]');
  await sleep(650);
  await dragMap(page, '[data-testid="didi-google-map"]', -88, 0);
  const centerAfterDragLeft = await mapCenter(page);
  record(
    'holding and dragging the map left moves the viewport east',
    centerAfterDragLeft.lng > centerBeforeFourWayPan.lng,
    `${centerBeforeFourWayPan.lng} -> ${centerAfterDragLeft.lng}`,
  );
  await clickAt(page, 'button[data-action="pickup.confirm.locate"]');
  await sleep(650);
  await dragMap(page, '[data-testid="didi-google-map"]', 0, 88);
  const centerAfterDragDown = await mapCenter(page);
  record(
    'holding and dragging the map down moves the viewport north',
    centerAfterDragDown.lat > centerBeforeFourWayPan.lat,
    `${centerBeforeFourWayPan.lat} -> ${centerAfterDragDown.lat}`,
  );
  await clickAt(page, 'button[data-action="pickup.confirm.locate"]');
  await sleep(650);
  await dragMap(page, '[data-testid="didi-google-map"]', 0, -88);
  const centerAfterDragUp = await mapCenter(page);
  record(
    'holding and dragging the map up moves the viewport south',
    centerAfterDragUp.lat < centerBeforeFourWayPan.lat,
    `${centerBeforeFourWayPan.lat} -> ${centerAfterDragUp.lat}`,
  );
  await clickAt(page, 'button[data-action="pickup.confirm.locate"]');
  const selectableMap = await page.$('[data-map-selectable="true"]');
  if (!selectableMap) throw new Error('selectable map surface missing');
  await selectableMap.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await sleep(700);
  const pickupAfterKeyboardPan = await state(page, 'app.pickupPoint');
  record(
    'keyboard map pan updates pickup',
    pickupAfterKeyboardPan !== pickupAreaState.pickup && pickupAfterKeyboardPan.includes('云江东站'),
    `${pickupAreaState.pickup} -> ${pickupAfterKeyboardPan}`,
  );
  await clickAt(page, 'button[data-action="pickup.confirm.locate"]');
  const pickupAfterLocate = await state(page, 'app.pickupPoint');
  record(
    'map locate control restores official pickup point',
    pickupAfterLocate === pickupAreaState.pickup,
    pickupAfterLocate,
  );
  await page.waitForSelector('[data-map-provider="shared-google-offline"]');
  await sleep(650);
  const viewportBeforePinch = await mapViewportMetrics(page);
  await pinchMap(page, '[data-testid="didi-google-map"]', 72, 22);
  await sleep(950);
  const viewportAfterPinch = await mapViewportMetrics(page);
  record(
    'two-finger pinch zooms the shared offline map',
    Number.isFinite(viewportBeforePinch.zoom)
      && Number.isFinite(viewportAfterPinch.zoom)
      && viewportAfterPinch.zoom < viewportBeforePinch.zoom,
    `${viewportBeforePinch.zoom} -> ${viewportAfterPinch.zoom}`,
  );
  record(
    'zooming out expands the visible geographic range',
    Number.isFinite(viewportBeforePinch.visibleSpanMeters)
      && Number.isFinite(viewportAfterPinch.visibleSpanMeters)
      && viewportBeforePinch.visibleSpanMeters > 0
      && viewportAfterPinch.visibleSpanMeters > viewportBeforePinch.visibleSpanMeters * 2,
    `${viewportBeforePinch.visibleSpanMeters}m -> ${viewportAfterPinch.visibleSpanMeters}m`,
  );
  const mapPicker = await page.$('[data-action="pickup.confirm.pan"]');
  const mapBox = await mapPicker?.boundingBox();
  if (!mapBox) throw new Error('map picker bounds missing');
  await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    mapBox.x + mapBox.width / 2 + 74,
    mapBox.y + mapBox.height / 2 + 54,
    { steps: 6 },
  );
  await page.mouse.up();
  await sleep(160);
  const pickupAfterPan = await state(page, 'app.pickupPoint');
  await clickAt(page, 'button[data-trigger="system.back"]', 1);
  await page.waitForSelector('button[data-trigger="dest.search.open"]');
  record(
    'enlarged map pan updates pickup and returns home',
    pickupAfterPan !== pickupAfterLocate
      && pickupAfterPan.includes('云江东站')
      && (await count(page, 'button[data-trigger="home.tab"]')) === 1,
    `${pickupBeforePan} -> ${pickupAfterPan}`,
  );
  await page.evaluate(() => window.__OS__.handleBack());
  await sleep(160);
  const activeAppAfterMapBack = await page.evaluate(() => window.__OS__.state.activeAppId);
  record(
    'map confirm leaves no duplicate home history entry',
    activeAppAfterMapBack !== 'didi',
    `activeAppId=${activeAppAfterMapBack ?? 'launcher'}`,
  );
  await page.evaluate(() => window.__OS__.openApp('didi'));
  await page.waitForSelector('button[data-trigger="home.tab"]');

  // P0: map-based destination selection uses nearby POIs and reaches route estimate.
  await clickAt(page, 'button[data-trigger="dest.search.open"]', 0);
  await clickAt(page, 'button[data-trigger="pickup.confirm.open"]');
  await page.waitForSelector('[data-testid^="didi-map-destination-"]');
  record(
    'destination map exposes nearby POIs',
    (await state(page, 'app.mapPickerMode')) === 'destination'
      && (await count(page, '[data-testid^="didi-map-destination-"]')) === 4,
  );
  // POI 已重锚到真实坐标，附近候选取自离线目录，这里选第一个未选中的候选而非写死 id。
  const mapDestinationCandidate = await page.$$eval(
    '[data-testid^="didi-map-destination-"]',
    (nodes) => {
      const node = nodes.find((item) => item.getAttribute('aria-pressed') !== 'true') ?? nodes[0];
      return {
        testId: node.getAttribute('data-testid'),
        name: node.querySelector('span > span')?.textContent?.trim() ?? '',
      };
    },
  );
  await clickAt(page, `[data-testid="${mapDestinationCandidate.testId}"]`);
  await clickAt(page, 'button[data-trigger="car.select.fromPickup"]');
  const mapDestinationTrip = await state(
    page,
    '({to: app.trip.to, routes: app.trip.routeOptions.length, hasCoords: Boolean(app.trip.toLatLng)})',
  );
  record(
    'destination map confirmation opens route estimate',
    mapDestinationTrip.to === mapDestinationCandidate.name
      && mapDestinationTrip.hasCoords === true
      && mapDestinationTrip.routes >= 1
      && (await count(page, 'button[data-trigger="call.waiting.open"]')) === 1,
    JSON.stringify({ ...mapDestinationTrip, picked: mapDestinationCandidate.name }),
  );
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await clickAt(page, 'button[data-trigger="system.back"]', 0);
  await page.waitForSelector('button[data-trigger="home.tab"]');

  // P0: home campaign coupon enters wallet once and updates the banner state.
  const homeCouponCountBefore = await state(page, 'app.user.couponCount');
  await clickAt(page, 'button[data-action="home.coupon.claim"]');
  const homeCouponClaimed = await state(page, 'app.coupons.filter((coupon) => coupon.id === "cp_home_ride_bundle")');
  const homeCouponCountAfter = await state(page, 'app.user.couponCount');
  const homeCouponButtonDisabled = await page.$$eval(
    'button:disabled',
    (buttons) => buttons.some((button) => button.textContent?.includes('已领取')),
  );
  record(
    'home ride coupon claim updates wallet once',
    homeCouponClaimed.length === 1
      && homeCouponClaimed[0].count === 3
      && homeCouponCountAfter === homeCouponCountBefore + 3
      && homeCouponButtonDisabled === true,
    JSON.stringify({ bundles: homeCouponClaimed.length, count: homeCouponCountAfter, disabled: homeCouponButtonDisabled }),
  );

  // P1: coupon wallet explains counts and "use now" reaches destination search.
  await clickAt(page, 'button[data-trigger="me.tab"]');
  await clickAt(page, 'button[data-trigger="coupons.list.open"]');
  const couponSummary = await page.$eval(
    '[data-testid="didi-coupon-count-summary"]',
    (element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
  await clickAt(page, 'button[data-trigger="coupons.toRide"]', 0);
  record(
    'coupon use-now opens destination search without a missing transition',
    (await count(page, 'input[data-testid="didi-place-search-input"]')) === 1
      && (await state(page, 'app.placeSearchTarget')) === 'destination',
  );
  record(
    'coupon wallet distinguishes package and sheet counts',
    couponSummary.includes(`${homeCouponClaimed.length + 9}个券包`)
      && couponSummary.includes(`${homeCouponCountAfter}张券`),
    couponSummary,
  );
  for (let step = 0; step < 4 && (await count(page, 'button[data-trigger="home.tab"]')) === 0; step += 1) {
    const activeAppId = await page.evaluate(() => window.__OS__.state.activeAppId);
    if (activeAppId === 'didi') {
      await back(page);
    } else {
      await page.evaluate(() => window.__OS__.openApp('didi'));
      await sleep(180);
    }
  }
  await page.waitForSelector('button[data-trigger="home.tab"]');
  await clickAt(page, 'button[data-trigger="home.tab"]');

  // P1: all-services ride uses the declared navigation graph.
  await clickAt(page, 'button[data-trigger="services.all.open"]');
  await clickAt(page, 'button[data-action="services.all.stub"]');
  record(
    'unavailable features require explicit confirmation',
    (await count(page, '[data-testid="didi-unavailable-dialog"]')) === 1
      && (await count(page, '[data-testid="didi-unavailable-confirm"]')) === 1,
  );
  await clickAt(page, '[data-testid="didi-unavailable-confirm"]');
  await clickAt(page, 'button[data-trigger="services.all.ride"]');
  record(
    'all-services ride returns through the declared transition',
    (await count(page, 'button[data-trigger="home.tab"]')) === 1,
  );

  // P0: destination -> car selection -> driver -> ongoing -> finish -> rating/coupon -> home.
  const ordersBefore = await state(page, 'app.orders.length');
  const couponsBefore = await state(page, 'app.user.couponCount');
  await openRidePicker(page);
  await clickAt(page, 'button[data-trigger="call.waiting.open"]');
  record('ride enters waiting phase', (await state(page, 'app.trip.phase')) === 'waiting');
  await clickAt(page, 'button[data-action="call.waiting.append.toggle"]', 0);
  await clickAt(page, 'button[data-action="call.waiting.append.confirm"]');
  record(
    'waiting ride confirms appended car types',
    (await state(page, 'app.trip.appended.length')) === 1,
  );
  await page.waitForFunction(
    () => window.__SIM__.getState().apps.didi.trip.phase === 'driver',
    { timeout: 5500 },
  );
  await page.waitForSelector('button[data-trigger="route.select.open"]');
  record('driver accepts ride', (await state(page, 'app.trip.phase')) === 'driver');

  // P0: 路线选择页给出真实路网候选，切换路线后里程与时长随之改变。
  await clickAt(page, 'button[data-trigger="route.select.open"]');
  await page.waitForSelector('[data-testid="didi-route-map"]');
  const routePlans = await page.$$eval('[data-testid^="didi-route-plan-"]', (nodes) => nodes.map((node) => ({
    testId: node.getAttribute('data-testid'),
    km: Number(node.getAttribute('data-route-distance-km')),
    selected: node.getAttribute('data-route-selected') === 'true',
    label: node.getAttribute('data-automation-label'),
  })));
  const routeMapGeometry = await page.$eval('[data-testid="didi-route-map"]', (element) => ({
    points: Number(element.getAttribute('data-route-points')),
    origin: element.getAttribute('data-route-origin'),
    selected: element.getAttribute('data-selected-route'),
  }));
  const tripOrigin = await state(page, 'app.trip.fromLatLng');
  record(
    'route selection offers at least two real road-network routes',
    routePlans.length >= 2
      && new Set(routePlans.map((plan) => plan.km)).size >= 2
      && routeMapGeometry.points > 5
      && routeMapGeometry.origin === `${tripOrigin.lat.toFixed(5)},${tripOrigin.lng.toFixed(5)}`,
    JSON.stringify({ plans: routePlans.map((plan) => `${plan.label}/${plan.km}km`), points: routeMapGeometry.points }),
  );

  const routeBefore = await state(page, '({id: app.trip.routeId, km: app.trip.distanceKm, min: app.trip.durationMin})');
  const alternatePlan = routePlans.find((plan) => !plan.selected) ?? routePlans[1];
  await clickAt(page, `[data-testid="${alternatePlan.testId}"]`);
  const routeAfter = await state(page, '({id: app.trip.routeId, km: app.trip.distanceKm, min: app.trip.durationMin})');
  const routeMapAfter = await page.$eval(
    '[data-testid="didi-route-map"]',
    (element) => element.getAttribute('data-selected-route'),
  );
  record(
    'switching route rebases distance, duration and the drawn polyline',
    routeAfter.id !== routeBefore.id
      && routeAfter.km === alternatePlan.km
      && routeAfter.km !== routeBefore.km
      && routeMapAfter === routeAfter.id,
    JSON.stringify({ before: routeBefore, after: routeAfter, map: routeMapAfter }),
  );
  await back(page);
  await page.waitForSelector('button[data-trigger="trip.ongoing.open"]');
  await clickAt(page, 'button[data-trigger="chat.detail.open"]');
  const emptyChatSendDisabled = await page.$eval(
    'button[data-action="chat.detail.send"]',
    (button) => button.disabled,
  );
  record('empty driver chat send is disabled', emptyChatSendDisabled === true);
  const driverChatCountBefore = await state(
    page,
    'app.driverChats.find((chat) => chat.id === app.currentChatId)?.msgs.length',
  );
  const driverChatInput = await page.$('input[data-action="chat.detail.input"]');
  if (!driverChatInput) throw new Error('driver chat input missing');
  await driverChatInput.type('我在路口等您');
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await clickAt(page, 'button[data-action="chat.detail.send"]');
  record(
    'driver chat send appends a message',
    (await state(
      page,
      'app.driverChats.find((chat) => chat.id === app.currentChatId)?.msgs.length',
    )) === driverChatCountBefore + 1,
  );
  await back(page);
  await clickAt(page, 'button[data-trigger="trip.ongoing.open"]');
  record('ride enters ongoing phase', (await state(page, 'app.trip.phase')) === 'ongoing');
  const ongoingMap = await page.$eval('[data-testid="didi-live-trip-map"]', (element) => ({
    geometry: element.getAttribute('data-live-geometry'),
    routePoints: Number(
      element.querySelector('[data-testid="didi-route-map"]')?.getAttribute('data-route-points') ?? 0,
    ),
  }));
  record(
    'ongoing trip animates along the real route polyline',
    ongoingMap.geometry === 'road-network' && ongoingMap.routePoints > 5,
    JSON.stringify(ongoingMap),
  );
  await clickAt(page, 'button[data-trigger="trip.finish.open"]');
  record('arrival creates order', (await state(page, 'app.trip.phase')) === 'finished' && (await state(page, 'app.orders.length')) === ordersBefore + 1);
  await clickAt(page, 'button[data-action="trip.finish.rate.face"]', 2);
  await clickAt(page, 'button[data-action="trip.finish.rate.tag.toggle"]', 0);
  await clickAt(page, 'button[data-action="trip.finish.rate.quick"]');
  const rated = await state(page, 'app.orders.find((o) => o.id === app.currentOrderId)?.rated === true');
  record('rating persists to current order', rated);
  await clickAt(page, 'button[data-action="trip.finish.coupon.claim"]');
  record('finish coupons update wallet', (await state(page, 'app.couponsClaimed')) === true && (await state(page, 'app.user.couponCount')) === couponsBefore + 4);
  await clickAt(page, 'button[data-trigger="trip.finish.done"]');
  record('finish returns home and resets trip', (await state(page, 'app.trip.phase')) === 'idle' && (await count(page, 'button[data-trigger="home.tab"]')) === 1);
  await page.evaluate(() => window.__OS__.handleBack());
  await sleep(160);
  const activeAppAfterFinishedTrip = await page.evaluate(() => window.__OS__.state.activeAppId);
  record(
    'root back after a finished trip exits instead of reopening history',
    activeAppAfterFinishedTrip !== 'didi',
    `activeAppId=${activeAppAfterFinishedTrip ?? 'launcher'}`,
  );
  await page.evaluate(() => window.__OS__.openApp('didi'));
  await page.waitForSelector('button[data-trigger="home.tab"]');

  // P0: accepted ride cancel -> retention -> reason survey -> home.
  await openRidePicker(page);
  await clickAt(page, 'button[data-trigger="call.waiting.open"]');
  await page.waitForFunction(
    () => window.__SIM__.getState().apps.didi.trip.phase === 'driver',
    { timeout: 5500 },
  );
  await page.waitForSelector('button[data-trigger="route.select.open"]');
  await clickAt(page, 'button[data-trigger="trip.cancel.open"]');
  record(
    'accepted cancellation shows retention state',
    (await state(page, 'app.trip.phase')) === 'driver' && (await count(page, 'button[data-action="trip.cancel.confirm"]')) === 1,
  );
  await clickAt(page, 'button[data-action="trip.cancel.confirm"]');
  record('cancel confirmation creates canceled order', (await state(page, 'app.trip.phase')) === 'canceled');
  await page.evaluate(() => window.__OS__.handleBack());
  await sleep(160);
  record(
    'system back from canceled survey returns to a valid home state',
    (await state(page, 'app.trip.phase')) === 'idle'
      && (await count(page, 'button[data-trigger="home.tab"]')) === 1,
  );

  await openRidePicker(page);
  await clickAt(page, 'button[data-trigger="call.waiting.open"]');
  await page.waitForFunction(
    () => window.__SIM__.getState().apps.didi.trip.phase === 'driver',
    { timeout: 5500 },
  );
  await page.waitForSelector('button[data-trigger="route.select.open"]');
  await clickAt(page, 'button[data-trigger="trip.cancel.open"]');
  await clickAt(page, 'button[data-action="trip.cancel.confirm"]');
  await clickAt(page, 'button[data-action="trip.cancel.reason.toggle"]', 0);
  record('cancel reason selection persists', (await state(page, 'app.cancelPicked.length')) === 1);
  await clickAt(page, 'button[data-trigger="trip.cancel.done"]');
  record('cancel survey returns home', (await state(page, 'app.trip.phase')) === 'idle' && (await count(page, 'button[data-trigger="home.tab"]')) === 1);

  // P0: trip list -> invoice selection -> form submit.
  await clickAt(page, 'button[data-trigger="trips.tab"]');
  await clickAt(page, '[data-testid="didi-trips-section-all"]');
  await clickAt(page, 'button[data-trigger="invoice.fromTrips"]', 0);
  const invoiceTripSelector = 'button[data-action="invoice.entry.trip.toggle"]:not([data-testid^="didi-invoice-month-toggle-"])';
  const invoiceRowsInFirstMonth = await page.evaluate(() => {
    const monthBtn = document.querySelector('[data-testid^="didi-invoice-month-toggle-"]');
    const group = monthBtn?.closest('.mb-3');
    if (!group) return 0;
    return group.querySelectorAll(
      'button[data-action="invoice.entry.trip.toggle"]:not([data-testid^="didi-invoice-month-toggle-"])',
    ).length;
  });
  await clickAt(page, '[data-testid^="didi-invoice-month-toggle-"]', 0);
  record(
    'invoice month select toggles every visible trip',
    invoiceRowsInFirstMonth > 0
      && (await state(page, 'app.invoiceSelected.length')) === invoiceRowsInFirstMonth,
    `${invoiceRowsInFirstMonth} trips`,
  );
  await clickAt(page, '[data-testid^="didi-invoice-month-toggle-"]', 0);
  record(
    'invoice month select can clear the selection',
    (await state(page, 'app.invoiceSelected.length')) === 0,
  );
  await clickAt(page, invoiceTripSelector, 0);
  const invoiceOrderId = await state(page, 'app.invoiceSelected[0]');
  await clickAt(page, 'button[data-trigger="invoice.form.open"]');
  await clickAt(page, 'button[data-action="invoice.form.submit"]');
  record(
    'invoice form rejects missing required fields',
    (await state(page, 'app.invoiceSelected.length')) === 1
      && (await state(page, 'app.lastToast')) === '请填写公司名称'
      && (await count(page, 'button[data-action="invoice.form.submit"]')) === 1,
  );
  const companyInput = await page.$('input[data-action="invoice.form.input"][data-action-params*="company"]');
  const taxInput = await page.$('input[data-action="invoice.form.input"][data-action-params*="taxNo"]');
  const emailInput = await page.$('input[data-action="invoice.form.input"][data-action-params*="email"]');
  if (!companyInput || !taxInput || !emailInput) throw new Error('invoice required fields missing');
  await companyInput.type('云江科技有限公司');
  await taxInput.type('91310000TEST000001');
  await emailInput.type('privacy-test@example.invalid');
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await clickAt(page, 'button[data-action="invoice.form.submit"]');
  record('invoice submission marks selected order', (await state(page, `app.orders.find((o) => o.id === ${JSON.stringify(invoiceOrderId)})?.invoiced === true`)) === true);
  record(
    'invoice submission clears private draft fields',
    Object.keys(await state(page, 'app.invoiceFields')).length === 0,
  );
  await sleep(400);
  const persistedInvoiceDraft = await page.evaluate(() => localStorage.getItem('didi_v7') || '');
  record(
    'invoice private fields never reach localStorage',
    !persistedInvoiceDraft.includes('云江科技有限公司')
      && !persistedInvoiceDraft.includes('91310000TEST000001')
      && !persistedInvoiceDraft.includes('privacy-test@example.invalid'),
  );
  record(
    'business orders persist across allowlist',
    persistedInvoiceDraft.includes('"orders"')
      && persistedInvoiceDraft.includes(invoiceOrderId)
      && persistedInvoiceDraft.includes('"addresses"')
      && persistedInvoiceDraft.includes('"user"'),
    `order=${invoiceOrderId}`,
  );

  // P0/P1: wallet payment channel, safety contact and support response.
  await back(page);
  await clickAt(page, 'button[data-trigger="me.tab"]');
  await clickAt(page, '[data-testid="didi-me-trips-toDepart"]');
  record(
    'Me pending-order shortcut opens a standalone matching list',
    (await state(page, 'app.tripsTab')) === 'toDepart'
      && (await count(page, '[data-page="orders"]')) === 1
      && (await count(page, '[data-trigger="order.detail.open"]')) >= 1
      && (await count(page, 'button[data-trigger="me.tab"]')) === 0,
  );
  await back(page);
  await clickAt(page, '[data-testid="didi-me-trips-all"]');
  const allOrderCount = await count(page, '[data-trigger="order.detail.open"]');
  record(
    'Me all-orders opens an independent page and resets the filter',
    (await state(page, 'app.tripsTab')) === 'all'
      && allOrderCount >= 5
      && (await count(page, '[data-page="orders"]')) === 1,
  );
  await page.$$eval('button[data-action="trips.list.tab"]', (nodes) => {
    const target = nodes.find((node) => node.textContent?.trim() === '已完成');
    if (!(target instanceof HTMLElement)) throw new Error('completed order tab missing');
    target.click();
  });
  await sleep(120);
  const completedOrderCount = await count(page, '[data-trigger="order.detail.open"]');
  await page.$$eval('button[data-action="trips.list.tab"]', (nodes) => {
    const target = nodes.find((node) => node.textContent?.trim() === '待评价');
    if (!(target instanceof HTMLElement)) throw new Error('unrated order tab missing');
    target.click();
  });
  await sleep(120);
  const unratedOrderCount = await count(page, '[data-trigger="order.detail.open"]');
  record(
    'order status tabs produce distinct non-empty results',
    completedOrderCount > 0
      && unratedOrderCount > 0
      && completedOrderCount < allOrderCount
      && unratedOrderCount < completedOrderCount,
    JSON.stringify({ allOrderCount, completedOrderCount, unratedOrderCount }),
  );
  await back(page);
  await clickAt(page, 'button[data-trigger="wallet.main.open"]');
  await clickAt(page, 'button[data-trigger="pay.settings.open"]');
  await clickAt(page, 'button[data-trigger="pay.methods.open"]');
  const appleBefore = await state(page, 'app.payChannels.find((p) => p.id === "applepay")?.on');
  const appleIndex = await page.$$eval('button[data-action="pay.methods.toggle"]', (nodes) => nodes.findIndex((n) => n.getAttribute('data-action-params')?.includes('applepay')));
  if (appleIndex < 0) throw new Error('Apple Pay action not found');
  await clickAt(page, 'button[data-action="pay.methods.toggle"]', appleIndex);
  record('payment channel toggle changes state', (await state(page, 'app.payChannels.find((p) => p.id === "applepay")?.on')) !== appleBefore);

  await back(page); await back(page); await back(page);
  await clickAt(page, 'button[data-trigger="settings.main.open"]');
  await clickAt(page, 'button[data-trigger="safety.fromSettings"]');
  await clickAt(page, 'button[data-trigger="safety.contacts.open"]');
  const contactsBefore = await state(page, 'app.settings.emergencyContacts.length');
  const contactInput = await page.$('input[data-action="safety.contacts.input"]');
  if (!contactInput) throw new Error('emergency contact input missing');
  await contactInput.type('00000000000');
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await clickAt(page, 'button[data-action="safety.contacts.add"]');
  record('emergency contact add changes state', (await state(page, 'app.settings.emergencyContacts.length')) === contactsBefore + 1);
  await clickAt(page, '[data-testid="safety-contacts-add-more"]');
  const duplicateContactInput = await page.$('input[data-action="safety.contacts.input"]');
  if (!duplicateContactInput) throw new Error('duplicate contact input missing');
  await duplicateContactInput.type('000 0000-0000');
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await clickAt(page, 'button[data-action="safety.contacts.add"]');
  record(
    'emergency contact add is idempotent',
    (await state(page, 'app.settings.emergencyContacts.length')) === contactsBefore + 1
      && (await state(page, 'app.lastToast')) === '该紧急联系人已添加',
  );

  await back(page); await back(page); await back(page);
  await clickAt(page, 'button[data-trigger="help.fromMe"]');
  const helpInput = await page.$('input[data-action="help.center.input"]');
  if (!helpInput) throw new Error('support input missing');
  await helpInput.type('如何查询费用明细');
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await clickAt(page, 'button[data-action="help.center.send"]');
  const helpResponse = await page.evaluate(() => document.body.innerText.includes('费用问题可在订单详情-费用明细中核对'));
  record('support message renders a relevant response', helpResponse);
  await clickAt(page, 'button[data-trigger="pay.fromHelp"]');
  record(
    'support payment settings uses the same functional page',
    (await count(page, 'button[data-trigger="pay.password.open"]')) === 1,
  );
  await back(page);

  // §11: from a deep page, repeated back must reach a tab root without cycling.
  const signatures = [];
  let reachedRoot = false;
  for (let i = 0; i < 8; i += 1) {
    const sig = await signature(page);
    signatures.push(sig);
    if ((await count(page, 'button[data-trigger="me.tab"]')) === 1 && !(await count(page, '[data-trigger-type="back"]'))) {
      reachedRoot = true;
      break;
    }
    await back(page);
  }
  record('back reachability returns to tab root', reachedRoot, `${signatures.length} steps`);
  record('back reachability has no cycle', new Set(signatures).size === signatures.length);

  // §10.2: OS locale switch updates the four root surfaces.
  await page.evaluate(() => window.__OS__.locale.setLocale('en'));
  await sleep(150);
  const englishTabs = await page.$$eval('[data-hide-on-keyboard] button span:last-child', (nodes) => nodes.map((n) => n.textContent));
  record('OS English locale updates DiDi tabs', ['Home', 'Messages', 'Trips', 'Me'].every((label) => englishTabs.includes(label)), englishTabs.join(','));

  await clickAt(page, 'button[data-trigger="home.tab"]');
  await clickAt(page, 'button[data-trigger="dest.search.open"]');
  const englishSearch = await page.evaluate(() => ({
    placeholder: document.querySelector('input[data-testid="didi-place-search-input"]')?.getAttribute('placeholder') ?? '',
    copy: document.querySelector('[data-testid="didi-place-results"]')?.parentElement?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));
  record(
    'destination search controls follow the English locale',
    englishSearch.placeholder === 'Where to?'
      && ['Home', 'Work', 'Favorites', 'Choose on map', 'Speak an address']
        .every((label) => englishSearch.copy.includes(label)),
    JSON.stringify(englishSearch),
  );
  await page.evaluate(() => window.__OS__.keyboard.hide());
  await back(page);
  await clickAt(page, 'button[data-trigger="me.tab"]');

  // P1: destructive account clearing requires a modeled confirmation and safe back stack.
  await clickAt(page, 'button[data-trigger="settings.main.open"]');
  const englishSettingsCopy = await page.$eval(
    '[data-testid="didi-settings-page"]',
    (element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
  record(
    'settings body follows the English locale',
    ['Account & safety', 'Appearance & personalization', 'Senior mode', 'Sign out']
      .every((label) => englishSettingsCopy.includes(label)),
    englishSettingsCopy,
  );
  await clickAt(page, 'button[data-trigger="settings.account.open"]');
  await clickAt(page, 'button[data-trigger="settings.account.delete.open"]');
  const englishDeleteCopy = await page.$eval(
    '[data-testid="didi-account-delete-page"]',
    (element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
  record(
    'deep account-delete confirmation follows the English locale',
    englishDeleteCopy.includes('Local personal data will be erased')
      && englishDeleteCopy.includes('Delete permanently'),
  );
  const couponBundleBeforeDeleteCancel = await state(
    page,
    'app.coupons.some((coupon) => coupon.id === "cp_home_ride_bundle")',
  );
  await back(page);
  record(
    'account-delete back cancels without clearing data',
    couponBundleBeforeDeleteCancel === true
      && (await state(page, 'app.coupons.some((coupon) => coupon.id === "cp_home_ride_bundle")')) === true
      && (await count(page, 'button[data-trigger="settings.account.delete.open"]')) === 1,
  );
  await clickAt(page, 'button[data-trigger="settings.account.delete.open"]');
  await clickAt(page, 'button[data-action="settings.account.clearPrivateData"]');
  record(
    'confirmed account deletion clears local private state and opens login',
    (await state(page, 'app.coupons.some((coupon) => coupon.id === "cp_home_ride_bundle")')) === false
      && (await count(page, 'input[data-action="auth.login.phone"]')) === 1,
  );
  await page.evaluate(() => window.__OS__.handleBack());
  await sleep(160);
  record(
    'account deletion leaves no destructive page in back history',
    (await count(page, '[data-testid="didi-account-delete-page"]')) === 0
      && (await count(page, 'button[data-trigger="settings.account.delete.open"]')) === 0,
  );
  await page.evaluate(() => window.__OS__.locale.setLocale('zh-Hans'));

  record('zero DiDi console/page errors', runtimeErrors.length === 0, runtimeErrors.slice(0, 3).join(' | '));
  await browser.close();

  const failed = results.filter((result) => !result.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    failed.forEach((failure) => console.log(`  ${failure.name}: ${failure.detail}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('WALKTHROUGH CRASHED:', error);
  process.exit(1);
});
