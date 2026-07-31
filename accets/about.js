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

const licenseModal = document.querySelector('[data-license-modal]');
const licenseTriggers = [...document.querySelectorAll('[data-license-open]')];

if (licenseModal && typeof licenseModal.showModal === 'function') {
  const licenseTitle = licenseModal.querySelector('[data-license-modal-title]');
  const licenseMeta = licenseModal.querySelector('[data-license-modal-meta]');
  const licenseDownload = licenseModal.querySelector('[data-license-download]');
  const licenseDownloadSize = licenseModal.querySelector('[data-license-download-size]');
  const licensePrevious = licenseModal.querySelector('[data-license-prev]');
  const licenseNext = licenseModal.querySelector('[data-license-next]');
  const licensePosition = licenseModal.querySelector('[data-license-position]');
  const licenseDocument = licenseModal.querySelector('.license-modal-document');
  const licenseTabs = [...licenseModal.querySelectorAll('[data-license-tab]')];
  const licensePanels = [...licenseModal.querySelectorAll('[data-license-panel]')];
  const licenseImages = [...licenseModal.querySelectorAll('[data-license-image]')];
  let activeLicenseTrigger = null;
  let currentLicenseIndex = -1;

  function activateLicenseTab(language, moveFocus = false) {
    licenseTabs.forEach(tab => {
      const isActive = tab.dataset.licenseTab === language;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && moveFocus) tab.focus();
    });

    licensePanels.forEach(panel => {
      panel.hidden = panel.dataset.licensePanel !== language;
    });

    const image = licenseImages.find(item => item.dataset.licenseImage === language);
    if (image && !image.getAttribute('src')) image.src = image.dataset.src;
  }

  function closeLicenseModal() {
    if (licenseModal.open) licenseModal.close();
  }

  function showLicense(index, language = 'kg') {
    currentLicenseIndex = (index + licenseTriggers.length) % licenseTriggers.length;
    const trigger = licenseTriggers[currentLicenseIndex];
    const title = trigger.dataset.licenseTitle;
    const registrationNumber = trigger.dataset.licenseNumber;

    licenseTitle.textContent = title;
    licenseMeta.textContent = `Регистрационный номер: ${registrationNumber} · Дата выдачи: 30 июля 2024 · Срок: бессрочно · Кыргызская Республика`;
    licenseDownload.href = trigger.href;
    licenseDownloadSize.textContent = trigger.dataset.licenseSize;
    licensePosition.textContent = `${currentLicenseIndex + 1} / ${licenseTriggers.length}`;

    licenseImages.forEach(image => {
      const imageLanguage = image.dataset.licenseImage;
      image.removeAttribute('src');
      image.dataset.src = imageLanguage === 'kg' ? trigger.dataset.licensePreviewKg : trigger.dataset.licensePreviewRu;
      image.alt = `${title} — ${imageLanguage === 'kg' ? 'версия на кыргызском языке' : 'версия на русском языке'}`;
    });

    activateLicenseTab(language);
    licenseDocument.scrollTop = 0;
  }

  function changeLicense(direction) {
    const activeTab = licenseTabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    showLicense(currentLicenseIndex + direction, activeTab?.dataset.licenseTab || 'kg');
  }

  licenseTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      activeLicenseTrigger = trigger;
      showLicense(index);
      if (!licenseModal.open) licenseModal.showModal();
      document.body.classList.add('license-modal-open');
    });
  });

  licensePrevious.addEventListener('click', () => changeLicense(-1));
  licenseNext.addEventListener('click', () => changeLicense(1));

  licenseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateLicenseTab(tab.dataset.licenseTab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + licenseTabs.length) % licenseTabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % licenseTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = licenseTabs.length - 1;
      activateLicenseTab(licenseTabs[nextIndex].dataset.licenseTab, true);
    });
  });

  licenseModal.querySelectorAll('[data-license-close]').forEach(button => {
    button.addEventListener('click', closeLicenseModal);
  });

  licenseModal.addEventListener('click', event => {
    if (event.target === licenseModal) closeLicenseModal();
  });

  licenseModal.addEventListener('close', () => {
    document.body.classList.remove('license-modal-open');
    licenseImages.forEach(image => image.removeAttribute('src'));
    activeLicenseTrigger?.focus();
    activeLicenseTrigger = null;
    currentLicenseIndex = -1;
  });
}
