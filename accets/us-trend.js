const header = document.querySelector('[data-header]');
const progress = document.querySelector('.progress i');
const menu = document.querySelector('[data-menu]');
const nav = document.querySelector('.nav');
const mobileMenuQuery = window.matchMedia('(max-width: 1050px)');
const headerHidePoint = document.querySelector('[data-header-hide]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getPageTop(element) {
  let top = 0;
  let current = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent;
  }
  return top;
}

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const hideHeaderAt = headerHidePoint && header ? getPageTop(headerHidePoint) - header.offsetHeight : Infinity;
  header?.classList.toggle('scrolled', y > 30);
  header?.classList.toggle('is-hidden', y >= hideHeaderAt);
  if (progress) progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

if (nav) {
  if (!nav.id) nav.id = 'site-navigation';
  menu?.setAttribute('aria-controls', nav.id);
}

function setMenuOpen(isOpen, { returnFocus = false } = {}) {
  const shouldOpen = Boolean(isOpen && mobileMenuQuery.matches);
  const shouldHideNav = mobileMenuQuery.matches && !shouldOpen;
  const shouldRestoreFocus = returnFocus || Boolean(shouldHideNav && nav?.contains(document.activeElement));

  document.body.classList.toggle('menu-open', shouldOpen);
  menu?.setAttribute('aria-expanded', String(shouldOpen));
  menu?.setAttribute('aria-label', shouldOpen ? 'Закрыть меню' : 'Открыть меню');

  if (nav) {
    nav.toggleAttribute('inert', shouldHideNav);
    if (shouldHideNav) nav.setAttribute('aria-hidden', 'true');
    else nav.removeAttribute('aria-hidden');
  }

  if (shouldRestoreFocus) menu?.focus();
}

function syncMenuState() {
  setMenuOpen(document.body.classList.contains('menu-open'));
}

menu?.addEventListener('click', () => {
  setMenuOpen(!document.body.classList.contains('menu-open'));
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  setMenuOpen(false);
}));

window.addEventListener('resize', syncMenuState);
if (typeof mobileMenuQuery.addEventListener === 'function') mobileMenuQuery.addEventListener('change', syncMenuState);
else mobileMenuQuery.addListener(syncMenuState);
syncMenuState();

if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    observer.observe(element);
  });
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
}

const usVisual = document.querySelector('[data-us-visual]');

if (usVisual) {
  const svg = usVisual.querySelector('.market-canvas');
  const candleLayer = usVisual.querySelector('[data-us-candles]');
  const volumeLayer = usVisual.querySelector('[data-us-volume]');
  const trendLine = usVisual.querySelector('[data-us-line]');
  const trendZone = usVisual.querySelector('[data-us-zone]');
  const riskLine = usVisual.querySelector('[data-us-risk-line]');
  const crossX = usVisual.querySelector('[data-us-cross-x]');
  const crossY = usVisual.querySelector('[data-us-cross-y]');
  const marketPoint = usVisual.querySelector('[data-us-point]');
  const stateLabel = usVisual.querySelector('[data-us-state]');
  const sessionLabel = usVisual.querySelector('[data-us-session]');
  const stageElements = Array.from(usVisual.querySelectorAll('[data-us-stage]'));
  const stageOrder = ['universe', 'trend', 'size', 'order'];
  const stateByStage = { universe: 'MARKET SCAN', trend: 'TREND FOUND', size: 'RISK SIZED', order: 'ORDER READY' };
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const candles = [
    { open: 48, close: 51, high: 54, low: 46, volume: 18, stage: 'universe' },
    { open: 51, close: 49, high: 53, low: 47, volume: 15, stage: 'universe' },
    { open: 49, close: 54, high: 57, low: 48, volume: 22, stage: 'universe' },
    { open: 54, close: 58, high: 60, low: 52, volume: 24, stage: 'universe' },
    { open: 58, close: 56, high: 61, low: 54, volume: 19, stage: 'trend' },
    { open: 56, close: 62, high: 65, low: 55, volume: 28, stage: 'trend' },
    { open: 62, close: 66, high: 69, low: 60, volume: 27, stage: 'trend' },
    { open: 66, close: 64, high: 68, low: 62, volume: 20, stage: 'trend' },
    { open: 64, close: 71, high: 73, low: 63, volume: 31, stage: 'trend' },
    { open: 71, close: 76, high: 79, low: 69, volume: 35, stage: 'size' },
    { open: 76, close: 73, high: 78, low: 71, volume: 26, stage: 'size' },
    { open: 73, close: 79, high: 82, low: 72, volume: 34, stage: 'size' },
    { open: 79, close: 83, high: 86, low: 77, volume: 38, stage: 'size' },
    { open: 83, close: 81, high: 85, low: 79, volume: 27, stage: 'size' },
    { open: 81, close: 87, high: 90, low: 80, volume: 41, stage: 'order' },
    { open: 87, close: 91, high: 94, low: 85, volume: 44, stage: 'order' },
    { open: 91, close: 89, high: 93, low: 87, volume: 30, stage: 'order' },
    { open: 89, close: 95, high: 98, low: 88, volume: 46, stage: 'order' },
    { open: 95, close: 99, high: 102, low: 93, volume: 50, stage: 'order' }
  ];
  const candleElements = [];
  const pricePoints = [];
  const xFor = index => 52 + index * 28;
  const yFor = value => 286 - (value - 44) * 4.35;

  candles.forEach((candle, index) => {
    const x = xFor(index);
    const openY = yFor(candle.open);
    const closeY = yFor(candle.close);
    const group = document.createElementNS(svgNamespace, 'g');
    const wick = document.createElementNS(svgNamespace, 'line');
    const body = document.createElementNS(svgNamespace, 'rect');
    const volume = document.createElementNS(svgNamespace, 'rect');
    group.setAttribute('class', `market-candle ${candle.close >= candle.open ? 'is-up' : 'is-down'}`);
    group.style.setProperty('--i', index);
    wick.setAttribute('x1', x);
    wick.setAttribute('x2', x);
    wick.setAttribute('y1', yFor(candle.high));
    wick.setAttribute('y2', yFor(candle.low));
    body.setAttribute('x', x - 5.5);
    body.setAttribute('y', Math.min(openY, closeY));
    body.setAttribute('width', 11);
    body.setAttribute('height', Math.max(4, Math.abs(closeY - openY)));
    group.append(wick, body);
    candleLayer?.append(group);
    volume.setAttribute('x', x - 6);
    volume.setAttribute('y', 300 - candle.volume * .38);
    volume.setAttribute('width', 12);
    volume.setAttribute('height', candle.volume * .38);
    volume.style.setProperty('--i', index);
    volumeLayer?.append(volume);
    candleElements.push(group);
    pricePoints.push([x, closeY]);
  });

  const trendPoints = candles.map((_, index) => {
    const sample = candles.slice(Math.max(0, index - 2), index + 1);
    const average = sample.reduce((sum, candle) => sum + candle.close, 0) / sample.length;
    return [xFor(index), yFor(average)];
  });
  const pathFor = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const trendPath = pathFor(trendPoints);
  trendLine?.setAttribute('d', trendPath);
  trendZone?.setAttribute('d', `${trendPath}L${trendPoints.at(-1)[0]} 300L${trendPoints[0][0]} 300Z`);

  let activeCandle = candles.length - 1;

  function activateCandle(index, showCrosshair = true) {
    activeCandle = Math.max(0, Math.min(candles.length - 1, index));
    const candle = candles[activeCandle];
    const activeStage = stageOrder.indexOf(candle.stage);
    const [x, y] = pricePoints[activeCandle];
    candleElements.forEach((element, candleIndex) => element.classList.toggle('is-focus', showCrosshair && candleIndex === activeCandle));
    crossX?.setAttribute('y1', y);
    crossX?.setAttribute('y2', y);
    crossY?.setAttribute('x1', x);
    crossY?.setAttribute('x2', x);
    marketPoint?.setAttribute('cx', x);
    marketPoint?.setAttribute('cy', y);
    const riskY = Math.min(272, y + 36);
    riskLine?.setAttribute('y1', riskY);
    riskLine?.setAttribute('y2', riskY);
    if (stateLabel) stateLabel.textContent = stateByStage[candle.stage];
    if (sessionLabel) sessionLabel.textContent = activeCandle < 4 ? 'PRE-MARKET' : 'SESSION';
    stageElements.forEach(stage => {
      const stageIndex = stageOrder.indexOf(stage.dataset.usStage);
      stage.classList.toggle('is-active', stageIndex === activeStage);
      stage.classList.toggle('is-complete', stageIndex <= activeStage);
    });
    usVisual.classList.toggle('is-interacting', showCrosshair);
  }

  activateCandle(activeCandle, false);
  usVisual.addEventListener('pointermove', event => {
    const svgRect = svg?.getBoundingClientRect();
    if (!svgRect) return;
    const relativeX = (event.clientX - svgRect.left) / svgRect.width * 620;
    activateCandle(Math.round((relativeX - 52) / 28));
  });
  usVisual.addEventListener('pointerleave', () => activateCandle(candles.length - 1, false));
  usVisual.addEventListener('focus', () => activateCandle(activeCandle));
  usVisual.addEventListener('blur', () => activateCandle(candles.length - 1, false));
  usVisual.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') activateCandle(activeCandle - 1);
    if (event.key === 'ArrowRight') activateCandle(activeCandle + 1);
    if (event.key === 'Home') activateCandle(0);
    if (event.key === 'End') activateCandle(candles.length - 1);
  });
}

const growthPanel = document.querySelector('.growth-panel');
const growthChart = growthPanel?.querySelector('.growth-chart');
const growthSvg = growthPanel?.querySelector('[data-growth-svg]');

if (growthPanel) {
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const growthObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-chart-animated');
        growthObserver.unobserve(entry.target);
      });
    }, { threshold: .28, rootMargin: '0px 0px -8% 0px' });
    growthObserver.observe(growthPanel);
  } else {
    growthPanel.classList.add('is-chart-animated');
  }
}

if (growthChart && growthSvg) {
  const strategyPath = growthSvg.querySelector('[data-growth-series="strategy"]');
  const marker = growthSvg.querySelector('[data-growth-marker]');
  const guide = growthSvg.querySelector('[data-growth-guide]');
  const halo = growthSvg.querySelector('[data-growth-halo]');
  const dot = growthSvg.querySelector('[data-growth-dot]');
  const tooltip = growthChart.querySelector('[data-growth-tooltip]');
  const tooltipLabel = growthChart.querySelector('[data-growth-tooltip-label]');
  const tooltipValue = growthChart.querySelector('[data-growth-tooltip-value]');
  const tooltipDate = growthChart.querySelector('[data-growth-tooltip-date]');
  const formatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const annualReturns = String(growthSvg.dataset.annualReturns || '').split(',').map(Number).filter(Number.isFinite);
  const startYear = Number(growthSvg.dataset.startYear) || 2016;
  let capital = 1;
  const cumulative = annualReturns.map(value => {
    capital *= 1 + value / 100;
    return (capital - 1) * 100;
  });
  const lineLength = strategyPath?.getTotalLength() || 0;
  const step = annualReturns.length > 1 ? 800 / (annualReturns.length - 1) : 800;

  function pointAtX(x) {
    if (!strategyPath) return null;
    let start = 0;
    let end = lineLength;
    for (let index = 0; index < 28; index += 1) {
      const middle = (start + end) / 2;
      if (strategyPath.getPointAtLength(middle).x < x) start = middle;
      else end = middle;
    }
    return strategyPath.getPointAtLength((start + end) / 2);
  }

  function hideTooltip() {
    marker?.classList.remove('is-active');
    tooltip?.classList.remove('is-active');
    tooltip?.setAttribute('aria-hidden', 'true');
  }

  function showTooltip(event) {
    const screenMatrix = growthSvg.getScreenCTM();
    if (!screenMatrix || !strategyPath || !cumulative.length) return;
    const cursor = growthSvg.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const svgCursor = cursor.matrixTransform(screenMatrix.inverse());
    if (svgCursor.x < 84 || svgCursor.x > 884 || svgCursor.y < 38 || svgCursor.y > 362) return hideTooltip();
    const point = pointAtX(svgCursor.x);
    if (!point || Math.abs(point.y - svgCursor.y) > 24) return hideTooltip();
    const position = Math.max(0, Math.min(cumulative.length - 1, (point.x - 84) / step));
    const startIndex = Math.floor(position);
    const endIndex = Math.min(cumulative.length - 1, startIndex + 1);
    const ratio = position - startIndex;
    const profit = cumulative[startIndex] + (cumulative[endIndex] - cumulative[startIndex]) * ratio;
    const yearIndex = Math.max(0, Math.min(cumulative.length - 1, Math.round(position)));
    const year = startYear + yearIndex;
    const screenPoint = growthSvg.createSVGPoint();
    screenPoint.x = point.x;
    screenPoint.y = point.y;
    const markerScreen = screenPoint.matrixTransform(screenMatrix);
    const chartRect = growthChart.getBoundingClientRect();
    const markerLeft = markerScreen.x - chartRect.left + growthChart.scrollLeft;
    const markerTop = markerScreen.y - chartRect.top + growthChart.scrollTop;
    guide?.setAttribute('x1', point.x);
    guide?.setAttribute('x2', point.x);
    halo?.setAttribute('cx', point.x);
    halo?.setAttribute('cy', point.y);
    dot?.setAttribute('cx', point.x);
    dot?.setAttribute('cy', point.y);
    marker?.classList.add('is-active');
    if (!tooltip) return;
    if (tooltipLabel) tooltipLabel.textContent = growthSvg.dataset.seriesLabel || 'US Trend';
    if (tooltipValue) tooltipValue.textContent = `+${formatter.format(profit)}%`;
    if (tooltipDate) tooltipDate.textContent = year === 2026 ? '2026 · YTD' : String(year);
    tooltip.classList.add('is-active');
    tooltip.setAttribute('aria-hidden', 'false');
    const visibleLeft = growthChart.scrollLeft + 12;
    const visibleRight = growthChart.scrollLeft + growthChart.clientWidth - 12;
    let left = markerLeft + 16;
    if (left + tooltip.offsetWidth > visibleRight) left = markerLeft - tooltip.offsetWidth - 16;
    tooltip.style.left = `${Math.max(visibleLeft, Math.min(left, visibleRight - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${Math.max(74, Math.min(markerTop - tooltip.offsetHeight / 2, growthChart.scrollHeight - tooltip.offsetHeight - 28))}px`;
  }

  growthSvg.addEventListener('pointermove', showTooltip);
  growthSvg.addEventListener('pointerdown', showTooltip);
  growthSvg.addEventListener('pointerleave', hideTooltip);
}

if (growthPanel && growthSvg) {
  const highlight = growthSvg.querySelector('[data-year-point-highlight]');
  const points = new Map(Array.from(growthSvg.querySelectorAll('[data-growth-year]')).map(point => [point.dataset.growthYear, point]));
  const yearRows = Array.from(growthPanel.querySelectorAll('[data-growth-year-row]'));
  const yearTooltip = growthChart?.querySelector('[data-growth-tooltip]');
  const yearTooltipLabel = growthChart?.querySelector('[data-growth-tooltip-label]');
  const yearTooltipValue = growthChart?.querySelector('[data-growth-tooltip-value]');
  const yearTooltipDate = growthChart?.querySelector('[data-growth-tooltip-date]');
  const yearProfitFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let yearCapital = 1;
  const cumulativeByYear = new Map(yearRows.map(row => {
    const annualReturn = Number(String(row.querySelector('strong')?.textContent || '').replace('−', '-').replace(/[^\d.-]/g, ''));
    yearCapital *= 1 + annualReturn / 100;
    return [row.dataset.growthYearRow, (yearCapital - 1) * 100];
  }));

  function showYearTooltip(row, point) {
    if (!growthChart || !yearTooltip) return;
    const screenMatrix = growthSvg.getScreenCTM();
    if (!screenMatrix) return;
    const x = Number(point.getAttribute('cx'));
    const y = Number(point.getAttribute('cy'));
    const screenPoint = growthSvg.createSVGPoint();
    screenPoint.x = x;
    screenPoint.y = y;
    const markerScreen = screenPoint.matrixTransform(screenMatrix);
    const chartRect = growthChart.getBoundingClientRect();
    const markerLeft = markerScreen.x - chartRect.left + growthChart.scrollLeft;
    const markerTop = markerScreen.y - chartRect.top + growthChart.scrollTop;
    const profit = cumulativeByYear.get(row.dataset.growthYearRow) || 0;
    yearTooltip.style.setProperty('--series-color', '#0c56c3');
    if (yearTooltipLabel) yearTooltipLabel.textContent = growthSvg.dataset.seriesLabel || 'US Trend';
    if (yearTooltipValue) yearTooltipValue.textContent = `+${yearProfitFormatter.format(profit)}%`;
    if (yearTooltipDate) yearTooltipDate.textContent = row.dataset.growthYearRow === '2026' ? '2026 · YTD' : row.dataset.growthYearRow;
    yearTooltip.classList.add('is-active');
    yearTooltip.setAttribute('aria-hidden', 'false');
    const visibleLeft = growthChart.scrollLeft + 12;
    const visibleRight = growthChart.scrollLeft + growthChart.clientWidth - 12;
    let left = markerLeft + 16;
    if (left + yearTooltip.offsetWidth > visibleRight) left = markerLeft - yearTooltip.offsetWidth - 16;
    yearTooltip.style.left = `${Math.max(visibleLeft, Math.min(left, visibleRight - yearTooltip.offsetWidth))}px`;
    yearTooltip.style.top = `${Math.max(74, Math.min(markerTop - yearTooltip.offsetHeight / 2, growthChart.scrollHeight - yearTooltip.offsetHeight - 28))}px`;
  }

  function hideYearTooltip() {
    highlight?.classList.remove('is-active');
    yearTooltip?.classList.remove('is-active');
    yearTooltip?.setAttribute('aria-hidden', 'true');
  }

  yearRows.forEach(row => {
    const activateYearRow = () => {
      const point = points.get(row.dataset.growthYearRow);
      if (!point || !highlight) return;
      highlight.setAttribute('cx', point.getAttribute('cx'));
      highlight.setAttribute('cy', point.getAttribute('cy'));
      highlight.classList.add('is-active');
      showYearTooltip(row, point);
    };
    row.tabIndex = 0;
    row.addEventListener('pointerenter', activateYearRow);
    row.addEventListener('focus', activateYearRow);
    row.addEventListener('pointerleave', hideYearTooltip);
    row.addEventListener('blur', hideYearTooltip);
  });
}

document.querySelectorAll('.strategy-faq-list details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.strategy-faq-list details[open]').forEach(openDetail => {
      if (openDetail !== detail) openDetail.removeAttribute('open');
    });
  });
});

const contactModal = document.querySelector('[data-contact-modal]');
const contactForm = document.querySelector('[data-contact-form]');
const closeContactModal = () => { if (contactModal?.open) contactModal.close(); };
document.querySelectorAll('[data-contact-open]').forEach(button => button.addEventListener('click', () => {
  if (contactModal && !contactModal.open) contactModal.showModal();
}));
document.querySelectorAll('[data-contact-close]').forEach(button => button.addEventListener('click', closeContactModal));
contactModal?.addEventListener('click', event => {
  const rect = contactModal.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeContactModal();
});
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const contact = String(data.get('contact') || '').trim();
  const message = String(data.get('message') || '').trim();
  const subject = encodeURIComponent(`Запрос по US Trend — ${name}`);
  const body = encodeURIComponent(`Имя: ${name}\nКонтакт: ${contact}\n\nКомментарий:\n${message || 'Без комментария'}`);
  closeContactModal();
  window.location.href = `mailto:info@quanthill.kg?subject=${subject}&body=${body}`;
});

const riskToast = document.querySelector('[data-risk-toast]');
const riskModal = document.querySelector('[data-risk-modal]');
let riskToastTimer = null;
function rememberRiskNotice() { try { sessionStorage.setItem('qh-risk-notice-seen', '1'); } catch (_) {} }
function hasSeenRiskNotice() { try { return sessionStorage.getItem('qh-risk-notice-seen') === '1'; } catch (_) { return false; } }
function setRiskToastVisible(isVisible) {
  if (!riskToast) return;
  riskToast.classList.toggle('show', isVisible);
  riskToast.toggleAttribute('inert', !isVisible);
  if (isVisible) riskToast.removeAttribute('aria-hidden');
  else riskToast.setAttribute('aria-hidden', 'true');
}
function hideRiskToast() {
  if (riskToastTimer !== null) window.clearTimeout(riskToastTimer);
  riskToastTimer = null;
  setRiskToastVisible(false);
  rememberRiskNotice();
}
function closeRiskModal() { if (riskModal?.open) riskModal.close(); }
document.querySelectorAll('[data-risk-open]').forEach(button => button.addEventListener('click', () => {
  hideRiskToast();
  if (riskModal && !riskModal.open) riskModal.showModal();
}));
document.querySelectorAll('[data-risk-close]').forEach(button => button.addEventListener('click', closeRiskModal));
document.querySelector('[data-risk-dismiss]')?.addEventListener('click', hideRiskToast);
riskModal?.addEventListener('click', event => {
  const rect = riskModal.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRiskModal();
});
if (riskToast) {
  const riskToastMessage = riskToast.querySelector('div');
  riskToastMessage?.setAttribute('role', 'status');
  riskToastMessage?.setAttribute('aria-live', 'polite');
  setRiskToastVisible(false);
}

if (!hasSeenRiskNotice()) {
  riskToastTimer = window.setTimeout(() => {
    riskToastTimer = null;
    if (!hasSeenRiskNotice()) setRiskToastVisible(true);
  }, reduceMotion ? 0 : 1400);
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (document.body.classList.contains('menu-open')) setMenuOpen(false, { returnFocus: true });
});
