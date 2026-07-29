const historySection = document.querySelector('[data-history]');
const historyEvents = [...document.querySelectorAll('[data-history-event]')];
const aboutReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHistoryProgress() {
  if (!historySection) return;
  const rect = historySection.getBoundingClientRect();
  const viewportAnchor = window.innerHeight * .62;
  const progress = Math.min(1, Math.max(0, (viewportAnchor - rect.top) / Math.max(rect.height, 1)));
  historySection.style.setProperty('--history-progress', progress.toFixed(3));
}

if (!aboutReducedMotion && 'IntersectionObserver' in window) {
  const historyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-active');
    });
  }, { threshold: .25, rootMargin: '0px 0px -12% 0px' });

  historyEvents.forEach(event => historyObserver.observe(event));
  window.addEventListener('scroll', updateHistoryProgress, { passive: true });
  window.addEventListener('resize', updateHistoryProgress);
  updateHistoryProgress();
} else {
  historyEvents.forEach(event => event.classList.add('is-active'));
  historySection?.style.setProperty('--history-progress', '1');
}
