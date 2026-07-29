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

const hedgeVisual = document.querySelector('[data-hedge-visual]');

if (hedgeVisual) {
  const svg = hedgeVisual.querySelector('.market-canvas');
  const candleLayer = hedgeVisual.querySelector('[data-hedge-candles]');
  const volumeLayer = hedgeVisual.querySelector('[data-hedge-volume]');
  const signalLine = hedgeVisual.querySelector('[data-hedge-line]');
  const signalZone = hedgeVisual.querySelector('[data-hedge-zone]');
  const crossX = hedgeVisual.querySelector('[data-hedge-cross-x]');
  const crossY = hedgeVisual.querySelector('[data-hedge-cross-y]');
  const marketPoint = hedgeVisual.querySelector('[data-hedge-point]');
  const regimeLabel = hedgeVisual.querySelector('[data-hedge-regime]');
  const exposureValue = hedgeVisual.querySelector('[data-hedge-value]');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const candles = [
    { open: 52, close: 57, high: 59, low: 50, volume: 19, regime: 'LONG', exposure: .42 },
    { open: 57, close: 63, high: 66, low: 55, volume: 25, regime: 'LONG', exposure: .58 },
    { open: 63, close: 61, high: 67, low: 59, volume: 18, regime: 'LONG', exposure: .47 },
    { open: 61, close: 69, high: 72, low: 60, volume: 31, regime: 'LONG', exposure: .71 },
    { open: 69, close: 76, high: 79, low: 67, volume: 36, regime: 'LONG', exposure: .82 },
    { open: 76, close: 82, high: 85, low: 74, volume: 40, regime: 'LONG', exposure: .88 },
    { open: 82, close: 79, high: 86, low: 77, volume: 28, regime: 'LONG', exposure: .62 },
    { open: 79, close: 72, high: 81, low: 69, volume: 43, regime: 'HEDGE', exposure: -.28 },
    { open: 72, close: 65, high: 74, low: 62, volume: 48, regime: 'HEDGE', exposure: -.54 },
    { open: 65, close: 59, high: 68, low: 56, volume: 45, regime: 'HEDGE', exposure: -.68 },
    { open: 59, close: 62, high: 65, low: 55, volume: 33, regime: 'HEDGE', exposure: -.36 },
    { open: 62, close: 58, high: 64, low: 54, volume: 39, regime: 'HEDGE', exposure: -.49 },
    { open: 58, close: 64, high: 67, low: 56, volume: 29, regime: 'LONG', exposure: .31 },
    { open: 64, close: 70, high: 73, low: 62, volume: 32, regime: 'LONG', exposure: .46 },
    { open: 70, close: 68, high: 74, low: 66, volume: 24, regime: 'LONG', exposure: .39 },
    { open: 68, close: 76, high: 79, low: 67, volume: 37, regime: 'LONG', exposure: .59 },
    { open: 76, close: 83, high: 86, low: 74, volume: 44, regime: 'LONG', exposure: .73 },
    { open: 83, close: 80, high: 87, low: 78, volume: 31, regime: 'LONG', exposure: .55 },
    { open: 80, close: 88, high: 91, low: 79, volume: 49, regime: 'LONG', exposure: .78 }
  ];
  const candleElements = [];
  const points = [];
  const xFor = index => 52 + index * 28;
  const yFor = value => 286 - (value - 48) * 5.2;

  candles.forEach((candle, index) => {
    const x = xFor(index);
    const openY = yFor(candle.open);
    const closeY = yFor(candle.close);
    const highY = yFor(candle.high);
    const lowY = yFor(candle.low);
    const group = document.createElementNS(svgNamespace, 'g');
    const wick = document.createElementNS(svgNamespace, 'line');
    const body = document.createElementNS(svgNamespace, 'rect');
    const volume = document.createElementNS(svgNamespace, 'rect');

    const direction = candle.close >= candle.open ? 'is-up' : 'is-down';
    group.setAttribute('class', `market-candle ${direction}${candle.regime === 'HEDGE' ? ' is-hedged' : ''}`);
    group.style.setProperty('--i', index);
    wick.setAttribute('x1', x);
    wick.setAttribute('x2', x);
    wick.setAttribute('y1', highY);
    wick.setAttribute('y2', lowY);
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
    points.push([x, closeY]);
  });

  const linePath = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  signalLine?.setAttribute('d', linePath);
  signalZone?.setAttribute('d', `${linePath}L${points[points.length - 1][0]} 300L${points[0][0]} 300Z`);

  let activeCandle = candles.length - 1;

  function activateCandle(index, showCrosshair = true) {
    activeCandle = Math.max(0, Math.min(candles.length - 1, index));
    candleElements.forEach((element, candleIndex) => element.classList.toggle('is-focus', candleIndex === activeCandle));
    const [x, y] = points[activeCandle];
    const candle = candles[activeCandle];
    crossX?.setAttribute('y1', y);
    crossX?.setAttribute('y2', y);
    crossY?.setAttribute('x1', x);
    crossY?.setAttribute('x2', x);
    marketPoint?.setAttribute('cx', x);
    marketPoint?.setAttribute('cy', y);
    if (regimeLabel) regimeLabel.textContent = candle.regime;
    if (exposureValue) exposureValue.textContent = `${candle.exposure >= 0 ? '+' : '−'}${Math.abs(candle.exposure).toFixed(2)}`;
    hedgeVisual.classList.toggle('is-interacting', showCrosshair);
  }

  hedgeVisual.addEventListener('pointermove', event => {
    const svgRect = svg?.getBoundingClientRect();
    if (!svgRect) return;
    const relativeX = (event.clientX - svgRect.left) / svgRect.width * 620;
    activateCandle(Math.round((relativeX - 52) / 28));
  });

  hedgeVisual.addEventListener('pointerleave', () => {
    hedgeVisual.classList.remove('is-interacting');
    candleElements.forEach(element => element.classList.remove('is-focus'));
  });
  hedgeVisual.addEventListener('focus', () => activateCandle(activeCandle));
  hedgeVisual.addEventListener('blur', () => hedgeVisual.classList.remove('is-interacting'));
  hedgeVisual.addEventListener('keydown', event => {
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
  const growthMarker = growthSvg.querySelector('[data-growth-marker]');
  const growthGuide = growthSvg.querySelector('[data-growth-guide]');
  const growthHalo = growthSvg.querySelector('[data-growth-halo]');
  const growthDot = growthSvg.querySelector('[data-growth-dot]');
  const growthTooltip = growthChart.querySelector('[data-growth-tooltip]');
  const growthTooltipLabel = growthChart.querySelector('[data-growth-tooltip-label]');
  const growthTooltipValue = growthChart.querySelector('[data-growth-tooltip-value]');
  const growthTooltipDate = growthChart.querySelector('[data-growth-tooltip-date]');
  const profitFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const annualReturns = String(growthSvg.dataset.annualReturns || '').split(',').map(Number).filter(Number.isFinite);
  let capital = 1;
  const cumulativeProfit = annualReturns.map(annualReturn => {
    capital *= 1 + annualReturn / 100;
    return (capital - 1) * 100;
  });
  const lineLength = strategyPath?.getTotalLength() || 0;

  function findPointAtX(x) {
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

  function hideGrowthTooltip() {
    growthMarker?.classList.remove('is-active');
    growthTooltip?.classList.remove('is-active');
    growthTooltip?.setAttribute('aria-hidden', 'true');
  }

  function showGrowthTooltip(event) {
    const screenMatrix = growthSvg.getScreenCTM();
    if (!screenMatrix || !strategyPath || !cumulativeProfit.length) return;
    const cursor = growthSvg.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const svgCursor = cursor.matrixTransform(screenMatrix.inverse());
    if (svgCursor.x < 84 || svgCursor.x > 884 || svgCursor.y < 38 || svgCursor.y > 362) {
      hideGrowthTooltip();
      return;
    }

    const point = findPointAtX(svgCursor.x);
    if (!point || Math.abs(point.y - svgCursor.y) > 24) {
      hideGrowthTooltip();
      return;
    }

    const position = Math.max(0, Math.min(cumulativeProfit.length - 1, (point.x - 84) / 100));
    const startIndex = Math.floor(position);
    const endIndex = Math.min(cumulativeProfit.length - 1, startIndex + 1);
    const ratio = position - startIndex;
    const profit = cumulativeProfit[startIndex] + (cumulativeProfit[endIndex] - cumulativeProfit[startIndex]) * ratio;
    const yearIndex = Math.max(0, Math.min(8, Math.round(position)));
    const period = yearIndex === 8 ? '2026 · YTD' : String(2018 + yearIndex);
    const screenPoint = growthSvg.createSVGPoint();
    screenPoint.x = point.x;
    screenPoint.y = point.y;
    const markerScreen = screenPoint.matrixTransform(screenMatrix);
    const chartRect = growthChart.getBoundingClientRect();
    const markerLeft = markerScreen.x - chartRect.left + growthChart.scrollLeft;
    const markerTop = markerScreen.y - chartRect.top + growthChart.scrollTop;

    growthGuide?.setAttribute('x1', point.x);
    growthGuide?.setAttribute('x2', point.x);
    growthHalo?.setAttribute('cx', point.x);
    growthHalo?.setAttribute('cy', point.y);
    growthDot?.setAttribute('cx', point.x);
    growthDot?.setAttribute('cy', point.y);
    growthMarker?.classList.add('is-active');

    if (!growthTooltip) return;
    if (growthTooltipLabel) growthTooltipLabel.textContent = growthSvg.dataset.seriesLabel || 'Bitcoin Hedge';
    if (growthTooltipValue) growthTooltipValue.textContent = `+${profitFormatter.format(profit)}%`;
    if (growthTooltipDate) growthTooltipDate.textContent = period;
    growthTooltip.classList.add('is-active');
    growthTooltip.setAttribute('aria-hidden', 'false');

    const tooltipWidth = growthTooltip.offsetWidth;
    const tooltipHeight = growthTooltip.offsetHeight;
    const visibleLeft = growthChart.scrollLeft + 12;
    const visibleRight = growthChart.scrollLeft + growthChart.clientWidth - 12;
    let tooltipLeft = markerLeft + 16;
    if (tooltipLeft + tooltipWidth > visibleRight) tooltipLeft = markerLeft - tooltipWidth - 16;
    tooltipLeft = Math.max(visibleLeft, Math.min(tooltipLeft, visibleRight - tooltipWidth));
    growthTooltip.style.left = `${tooltipLeft}px`;
    growthTooltip.style.top = `${Math.max(74, Math.min(markerTop - tooltipHeight / 2, growthChart.scrollHeight - tooltipHeight - 28))}px`;
  }

  growthSvg.addEventListener('pointermove', showGrowthTooltip);
  growthSvg.addEventListener('pointerdown', showGrowthTooltip);
  growthSvg.addEventListener('pointerleave', hideGrowthTooltip);
}

if (growthPanel && growthSvg) {
  const yearHighlight = growthSvg.querySelector('[data-year-point-highlight]');
  const yearPoints = new Map(Array.from(growthSvg.querySelectorAll('[data-growth-year]')).map(point => [point.dataset.growthYear, point]));
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
    if (yearTooltipLabel) yearTooltipLabel.textContent = growthSvg.dataset.seriesLabel || 'Bitcoin Hedge';
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
    yearHighlight?.classList.remove('is-active');
    yearTooltip?.classList.remove('is-active');
    yearTooltip?.setAttribute('aria-hidden', 'true');
  }

  yearRows.forEach(row => {
    const activateYearRow = () => {
      const point = yearPoints.get(row.dataset.growthYearRow);
      if (!point || !yearHighlight) return;
      yearHighlight.setAttribute('cx', point.getAttribute('cx'));
      yearHighlight.setAttribute('cy', point.getAttribute('cy'));
      yearHighlight.classList.add('is-active');
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

function openContactModal() {
  if (contactModal && !contactModal.open) contactModal.showModal();
}

function closeContactModal() {
  if (contactModal?.open) contactModal.close();
}

document.querySelectorAll('[data-contact-open]').forEach(button => button.addEventListener('click', openContactModal));
document.querySelectorAll('[data-contact-close]').forEach(button => button.addEventListener('click', closeContactModal));

contactModal?.addEventListener('click', event => {
  const rect = contactModal.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeContactModal();
});

contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = String(formData.get('name') || '').trim();
  const contact = String(formData.get('contact') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const subject = encodeURIComponent(`Запрос по Bitcoin Hedge — ${name}`);
  const body = encodeURIComponent(`Имя: ${name}\nКонтакт: ${contact}\n\nКомментарий:\n${message || 'Без комментария'}`);
  closeContactModal();
  window.location.href = `mailto:info@quanthill.kg?subject=${subject}&body=${body}`;
});

const riskToast = document.querySelector('[data-risk-toast]');
const riskModal = document.querySelector('[data-risk-modal]');
let riskToastTimer = null;

function rememberRiskNotice() {
  try { sessionStorage.setItem('qh-risk-notice-seen', '1'); } catch (_) {}
}

function hasSeenRiskNotice() {
  try { return sessionStorage.getItem('qh-risk-notice-seen') === '1'; } catch (_) { return false; }
}

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

function openRiskModal() {
  hideRiskToast();
  if (riskModal && !riskModal.open) riskModal.showModal();
}

function closeRiskModal() {
  if (riskModal?.open) riskModal.close();
}

document.querySelectorAll('[data-risk-open]').forEach(button => button.addEventListener('click', openRiskModal));
document.querySelectorAll('[data-risk-close]').forEach(button => button.addEventListener('click', closeRiskModal));
document.querySelector('[data-risk-dismiss]')?.addEventListener('click', hideRiskToast);

riskModal?.addEventListener('click', event => {
  const rect = riskModal.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeRiskModal();
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
