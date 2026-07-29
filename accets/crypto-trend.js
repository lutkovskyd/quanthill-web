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
  const growthSeries = Array.from(growthSvg.querySelectorAll('[data-growth-series]')).map(path => ({
    path,
    id: path.dataset.growthSeries,
    label: path.dataset.growthSeries === 'btc' ? 'BTC' : 'Crypto Trend USDT',
    color: path.dataset.growthSeries === 'btc' ? '#b8862f' : '#0c56c3',
    length: path.getTotalLength()
  }));
  const growthMarker = growthSvg.querySelector('[data-growth-marker]');
  const growthGuide = growthSvg.querySelector('[data-growth-guide]');
  const growthHalo = growthSvg.querySelector('[data-growth-halo]');
  const growthDot = growthSvg.querySelector('[data-growth-dot]');
  const growthTooltip = growthChart.querySelector('[data-growth-tooltip]');
  const growthTooltipLabel = growthChart.querySelector('[data-growth-tooltip-label]');
  const growthTooltipValue = growthChart.querySelector('[data-growth-tooltip-value]');
  const growthTooltipDate = growthChart.querySelector('[data-growth-tooltip-date]');
  const profitFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
  const cryptoAnnualReturns = [202.5, 186.6, 175.6, -13.4, 7.8, 33.1, 48.8, 6.9, 8.7];
  let cryptoCapital = 1;
  const cryptoProfitPoints = cryptoAnnualReturns.map(annualReturn => {
    cryptoCapital *= 1 + annualReturn / 100;
    return (cryptoCapital - 1) * 100;
  });

  function findGrowthPointAtX(series, x) {
    let start = 0;
    let end = series.length;
    for (let index = 0; index < 28; index += 1) {
      const middle = (start + end) / 2;
      if (series.path.getPointAtLength(middle).x < x) start = middle;
      else end = middle;
    }
    return series.path.getPointAtLength((start + end) / 2);
  }

  function formatGrowthPeriod(x) {
    if (x >= 879) return '2026 · YTD';
    const monthOffset = Math.max(0, Math.round((x - 84) / 100 * 12));
    return monthFormatter.format(new Date(2018, 11 + monthOffset, 1)).replace(' г.', '');
  }

  function calculateGrowthProfit(series, point) {
    if (series.id !== 'crypto') return (350 - point.y) * 20;
    const position = Math.max(0, Math.min(cryptoProfitPoints.length - 1, (point.x - 84) / 100));
    const startIndex = Math.floor(position);
    const endIndex = Math.min(cryptoProfitPoints.length - 1, startIndex + 1);
    const progress = position - startIndex;
    return cryptoProfitPoints[startIndex] + (cryptoProfitPoints[endIndex] - cryptoProfitPoints[startIndex]) * progress;
  }

  function hideGrowthTooltip() {
    growthMarker?.classList.remove('is-active');
    growthTooltip?.classList.remove('is-active');
    growthTooltip?.setAttribute('aria-hidden', 'true');
  }

  function showGrowthTooltip(event) {
    const screenMatrix = growthSvg.getScreenCTM();
    if (!screenMatrix) return;
    const cursor = growthSvg.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const svgCursor = cursor.matrixTransform(screenMatrix.inverse());
    if (svgCursor.x < 84 || svgCursor.x > 884 || svgCursor.y < 38 || svgCursor.y > 362) {
      hideGrowthTooltip();
      return;
    }

    const candidates = growthSeries.map(series => {
      const point = findGrowthPointAtX(series, svgCursor.x);
      return { series, point, distance: Math.abs(point.y - svgCursor.y) };
    }).sort((first, second) => first.distance - second.distance);
    const active = candidates[0];
    if (!active || active.distance > 22) {
      hideGrowthTooltip();
      return;
    }

    const profit = calculateGrowthProfit(active.series, active.point);
    const prefix = profit > .05 ? '+' : profit < -.05 ? '−' : '';
    const screenPoint = growthSvg.createSVGPoint();
    screenPoint.x = active.point.x;
    screenPoint.y = active.point.y;
    const markerScreen = screenPoint.matrixTransform(screenMatrix);
    const chartRect = growthChart.getBoundingClientRect();
    const markerLeft = markerScreen.x - chartRect.left + growthChart.scrollLeft;
    const markerTop = markerScreen.y - chartRect.top + growthChart.scrollTop;

    growthGuide?.setAttribute('x1', active.point.x);
    growthGuide?.setAttribute('x2', active.point.x);
    growthHalo?.setAttribute('cx', active.point.x);
    growthHalo?.setAttribute('cy', active.point.y);
    growthDot?.setAttribute('cx', active.point.x);
    growthDot?.setAttribute('cy', active.point.y);
    growthMarker?.style.setProperty('color', active.series.color);
    growthMarker?.classList.add('is-active');

    if (!growthTooltip) return;
    growthTooltip.style.setProperty('--series-color', active.series.color);
    if (growthTooltipLabel) growthTooltipLabel.textContent = active.series.label;
    if (growthTooltipValue) growthTooltipValue.textContent = `${prefix}${profitFormatter.format(Math.abs(profit))}%`;
    if (growthTooltipDate) growthTooltipDate.textContent = formatGrowthPeriod(active.point.x);
    growthTooltip.classList.add('is-active');
    growthTooltip.setAttribute('aria-hidden', 'false');

    const tooltipWidth = growthTooltip.offsetWidth;
    const tooltipHeight = growthTooltip.offsetHeight;
    const visibleLeft = growthChart.scrollLeft + 12;
    const visibleRight = growthChart.scrollLeft + growthChart.clientWidth - 12;
    let tooltipLeft = markerLeft + 16;
    if (tooltipLeft + tooltipWidth > visibleRight) tooltipLeft = markerLeft - tooltipWidth - 16;
    tooltipLeft = Math.max(visibleLeft, Math.min(tooltipLeft, visibleRight - tooltipWidth));
    const tooltipTop = Math.max(74, Math.min(markerTop - tooltipHeight / 2, growthChart.scrollHeight - tooltipHeight - 28));
    growthTooltip.style.left = `${tooltipLeft}px`;
    growthTooltip.style.top = `${tooltipTop}px`;
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
    const prefix = profit > .05 ? '+' : profit < -.05 ? '−' : '';
    yearTooltip.style.setProperty('--series-color', '#0c56c3');
    if (yearTooltipLabel) yearTooltipLabel.textContent = 'Crypto Trend USDT';
    if (yearTooltipValue) yearTooltipValue.textContent = `${prefix}${yearProfitFormatter.format(Math.abs(profit))}%`;
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

  function hideYearHighlight() {
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
    row.addEventListener('pointerleave', hideYearHighlight);
    row.addEventListener('blur', hideYearHighlight);
  });
}

const tradeMixChart = document.querySelector('.trade-mix-chart');

if (tradeMixChart) {
  const tradeRows = new Map(Array.from(tradeMixChart.querySelectorAll('[data-trade-row]')).map(row => [row.dataset.tradeRow, row]));
  const clearTradeRow = () => tradeRows.forEach(row => row.classList.remove('is-segment-active'));

  tradeMixChart.querySelectorAll('[data-trade-key]').forEach(segment => {
    segment.addEventListener('pointerenter', () => {
      clearTradeRow();
      tradeRows.get(segment.dataset.tradeKey)?.classList.add('is-segment-active');
    });
    segment.addEventListener('pointerleave', clearTradeRow);
  });
}

const marketVisual = document.querySelector('[data-market-visual]');

if (marketVisual) {
  const svg = marketVisual.querySelector('.market-canvas');
  const candleLayer = marketVisual.querySelector('[data-market-candles]');
  const volumeLayer = marketVisual.querySelector('[data-market-volume]');
  const signalLine = marketVisual.querySelector('[data-market-line]');
  const signalZone = marketVisual.querySelector('[data-market-zone]');
  const signalCorridor = marketVisual.querySelector('[data-market-corridor]');
  const upperRisk = marketVisual.querySelector('[data-market-upper]');
  const lowerRisk = marketVisual.querySelector('[data-market-lower]');
  const crosshair = marketVisual.querySelector('[data-market-crosshair]');
  const crossX = marketVisual.querySelector('[data-market-cross-x]');
  const crossY = marketVisual.querySelector('[data-market-cross-y]');
  const marketPoint = marketVisual.querySelector('[data-market-point]');
  const trendState = marketVisual.querySelector('[data-trend-state]');
  const trendScore = marketVisual.querySelector('[data-trend-score]');
  const modelStages = Array.from(marketVisual.querySelectorAll('[data-model-stage]'));
  const stageOrder = ['data', 'signal', 'risk', 'execute'];
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const candles = [
    { open: 44, close: 47, high: 49, low: 41, volume: 18, stage: 'data', score: .08 },
    { open: 47, close: 45, high: 50, low: 43, volume: 15, stage: 'data', score: .12 },
    { open: 45, close: 51, high: 53, low: 44, volume: 24, stage: 'data', score: .10 },
    { open: 51, close: 55, high: 58, low: 49, volume: 23, stage: 'data', score: .16 },
    { open: 56, close: 53, high: 59, low: 51, volume: 18, stage: 'signal', score: .24 },
    { open: 53, close: 60, high: 62, low: 52, volume: 28, stage: 'signal', score: .31 },
    { open: 60, close: 64, high: 67, low: 58, volume: 25, stage: 'signal', score: .38 },
    { open: 64, close: 61, high: 66, low: 59, volume: 20, stage: 'signal', score: .44 },
    { open: 61, close: 68, high: 70, low: 60, volume: 30, stage: 'signal', score: .51 },
    { open: 68, close: 73, high: 76, low: 66, volume: 34, stage: 'risk', score: .56 },
    { open: 73, close: 70, high: 75, low: 68, volume: 25, stage: 'risk', score: .61 },
    { open: 70, close: 76, high: 78, low: 69, volume: 33, stage: 'risk', score: .58 },
    { open: 76, close: 81, high: 83, low: 74, volume: 38, stage: 'risk', score: .67 },
    { open: 81, close: 78, high: 84, low: 76, volume: 29, stage: 'execute', score: .71 },
    { open: 78, close: 84, high: 86, low: 77, volume: 41, stage: 'execute', score: .69 },
    { open: 84, close: 88, high: 91, low: 82, volume: 44, stage: 'execute', score: .74 },
    { open: 88, close: 85, high: 90, low: 83, volume: 31, stage: 'execute', score: .76 },
    { open: 85, close: 91, high: 94, low: 84, volume: 45, stage: 'execute', score: .73 },
    { open: 91, close: 94, high: 97, low: 89, volume: 52, stage: 'execute', score: .78 }
  ];
  const candleElements = [];
  const pricePoints = [];
  const xFor = index => 52 + index * 28;
  const yFor = value => 292 - (value - 40) * 3.8;

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

    group.setAttribute('class', `market-candle ${candle.close >= candle.open ? 'is-up' : 'is-down'}`);
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
    volume.setAttribute('y', 312 - candle.volume * .38);
    volume.setAttribute('width', 12);
    volume.setAttribute('height', candle.volume * .38);
    volume.style.setProperty('--i', index);
    volumeLayer?.append(volume);

    candleElements.push(group);
    pricePoints.push([x, closeY]);
  });

  const signalPoints = candles.map((_, index) => {
    const sample = candles.slice(Math.max(0, index - 2), index + 1);
    const average = sample.reduce((total, candle) => total + candle.close, 0) / sample.length;
    return [xFor(index), yFor(average)];
  });
  const makePath = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const linePath = makePath(signalPoints);
  const upperPoints = signalPoints.map(([x, y]) => [x, y - 20]);
  const lowerPoints = signalPoints.map(([x, y]) => [x, y + 20]);
  const corridorPath = `${makePath(upperPoints)}${lowerPoints.slice().reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('')}Z`;
  signalLine?.setAttribute('d', linePath);
  signalZone?.setAttribute('d', `${linePath}L${signalPoints[signalPoints.length - 1][0]} 312L${signalPoints[0][0]} 312Z`);
  signalCorridor?.setAttribute('d', corridorPath);
  upperRisk?.setAttribute('d', makePath(upperPoints));
  lowerRisk?.setAttribute('d', makePath(lowerPoints));

  let activeCandle = candles.length - 1;

  function activateCandle(index, showCrosshair = true) {
    activeCandle = Math.max(0, Math.min(candles.length - 1, index));
    candleElements.forEach((element, candleIndex) => element.classList.toggle('is-focus', showCrosshair && candleIndex === activeCandle));
    const candle = candles[activeCandle];
    const activeStageIndex = stageOrder.indexOf(candle.stage);
    const [x, y] = pricePoints[activeCandle];
    crossX?.setAttribute('y1', y);
    crossX?.setAttribute('y2', y);
    crossY?.setAttribute('x1', x);
    crossY?.setAttribute('x2', x);
    marketPoint?.setAttribute('cx', x);
    marketPoint?.setAttribute('cy', y);
    if (trendState) trendState.textContent = candle.stage.toUpperCase();
    if (trendScore) trendScore.textContent = `+${candle.score.toFixed(2)}`;
    modelStages.forEach(stage => {
      const stageIndex = stageOrder.indexOf(stage.dataset.modelStage);
      stage.classList.toggle('is-active', stageIndex === activeStageIndex);
      stage.classList.toggle('is-complete', stageIndex <= activeStageIndex);
    });
    marketVisual.classList.toggle('is-interacting', showCrosshair);
  }

  activateCandle(activeCandle, false);

  marketVisual.addEventListener('pointermove', event => {
    const svgRect = svg?.getBoundingClientRect();
    if (!svgRect) return;
    const relativeX = (event.clientX - svgRect.left) / svgRect.width * 620;
    const index = Math.round((relativeX - 52) / 28);
    activateCandle(index);
  });

  marketVisual.addEventListener('pointerleave', () => {
    activateCandle(candles.length - 1, false);
  });

  marketVisual.addEventListener('focus', () => activateCandle(activeCandle));
  marketVisual.addEventListener('blur', () => activateCandle(candles.length - 1, false));
  marketVisual.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') activateCandle(activeCandle - 1);
    if (event.key === 'ArrowRight') activateCandle(activeCandle + 1);
    if (event.key === 'Home') activateCandle(0);
    if (event.key === 'End') activateCandle(candles.length - 1);
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
  const subject = encodeURIComponent(`Запрос по Crypto Trend — ${name}`);
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
