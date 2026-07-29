const header = document.querySelector('[data-header]');
const progress = document.querySelector('.progress i');
const menu = document.querySelector('[data-menu]');
const navigation = document.querySelector('.nav');
const mobileNavigation = window.matchMedia('(max-width: 1050px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroImage = document.querySelector('.hero-image img');
const heroImageFrame = document.querySelector('.hero-image');
const heroVariantButtons = [...document.querySelectorAll('[data-hero-src]')];
const headerHidePoint = document.querySelector('[data-header-hide]');

heroVariantButtons.forEach(button => {
  const preload = new Image();
  preload.src = button.dataset.heroSrc;

  button.addEventListener('click', () => {
    if (button.classList.contains('is-active') || !heroImage) return;

    heroVariantButtons.forEach(item => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    heroImage.classList.toggle('hero-image-office', button.dataset.heroPosition === 'office');
    heroImage.classList.toggle('hero-image-bank-right', button.dataset.heroPosition === 'bank-right');
    heroImage.classList.add('is-switching');
    const nextImage = new Image();
    nextImage.onload = () => {
      heroImage.src = button.dataset.heroSrc;
      heroImageFrame?.classList.toggle('hero-image-soft-overlay', button.dataset.heroOverlay === 'soft');
      requestAnimationFrame(() => heroImage.classList.remove('is-switching'));
    };
    nextImage.src = button.dataset.heroSrc;
  });
});

const technologyItems = [...document.querySelectorAll('[data-technology-item]')];
const technologyVisual = document.querySelector('[data-technology-visual]');
const technologyPacketMotions = [...document.querySelectorAll('.technology-packet-motion')];

technologyItems.forEach(item => {
  const button = item.querySelector('[data-technology-toggle]');
  button?.addEventListener('click', () => {
    technologyItems.forEach(current => {
      const isActive = current === item;
      current.classList.toggle('is-active', isActive);
      current.querySelector('[data-technology-toggle]')?.setAttribute('aria-expanded', String(isActive));
    });
    if (technologyVisual) technologyVisual.dataset.focus = item.dataset.technologyItem;
    const packetDuration = item.dataset.technologyItem === '1' ? '1.65s' : '4.2s';
    technologyPacketMotions.forEach(motion => motion.setAttribute('dur', packetDuration));
  });
});

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
  const hideHeaderAt = headerHidePoint ? getPageTop(headerHidePoint) - header.offsetHeight : Infinity;
  header.classList.toggle('scrolled', y > 30);
  header.classList.toggle('is-hidden', y >= hideHeaderAt);
  progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  if (!reduceMotion && heroImage) {
    heroImage.style.transform = `scale(1.02) translateY(${Math.min(y * .07, 55)}px)`;
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (navigation) {
  if (!navigation.id) navigation.id = 'site-navigation';
  menu?.setAttribute('aria-controls', navigation.id);
}

function setMenuOpen(isOpen, { restoreFocus = false } = {}) {
  const shouldOpen = mobileNavigation.matches && isOpen;
  document.body.classList.toggle('menu-open', shouldOpen);
  menu?.setAttribute('aria-expanded', String(shouldOpen));
  menu?.setAttribute('aria-label', shouldOpen ? 'Закрыть меню' : 'Открыть меню');

  if (navigation) {
    const isHidden = mobileNavigation.matches && !shouldOpen;
    navigation.toggleAttribute('inert', isHidden);
    if (mobileNavigation.matches) navigation.setAttribute('aria-hidden', String(isHidden));
    else navigation.removeAttribute('aria-hidden');
  }

  if (restoreFocus) menu?.focus();
}

menu?.addEventListener('click', () => {
  setMenuOpen(!document.body.classList.contains('menu-open'));
});

document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
  setMenuOpen(false);
}));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    setMenuOpen(false, { restoreFocus: true });
  }
});

const syncMenuForViewport = () => setMenuOpen(false);
if (mobileNavigation.addEventListener) mobileNavigation.addEventListener('change', syncMenuForViewport);
else mobileNavigation.addListener(syncMenuForViewport);
setMenuOpen(false);

if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 55}ms`);
    observer.observe(element);
  });
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
}

const contactModal = document.querySelector('[data-contact-modal]');
const contactOpeners = document.querySelectorAll('[data-contact-open]');
const contactClosers = document.querySelectorAll('[data-contact-close]');
const contactForm = document.querySelector('[data-contact-form]');

function openContactModal() {
  if (contactModal && !contactModal.open) contactModal.showModal();
}

function closeContactModal() {
  if (contactModal?.open) contactModal.close();
}

contactOpeners.forEach(button => button.addEventListener('click', openContactModal));
contactClosers.forEach(button => button.addEventListener('click', closeContactModal));

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
  const subject = encodeURIComponent(`Запрос с сайта Quant Hill — ${name}`);
  const body = encodeURIComponent(`Имя: ${name}\nКонтакт: ${contact}\n\nЗадача:\n${message}`);

  closeContactModal();
  window.location.href = `mailto:info@quanthill.kg?subject=${subject}&body=${body}`;
});

const riskToast = document.querySelector('[data-risk-toast]');
const riskModal = document.querySelector('[data-risk-modal]');
const riskOpeners = document.querySelectorAll('[data-risk-open]');
const riskClosers = document.querySelectorAll('[data-risk-close]');
const riskDismiss = document.querySelector('[data-risk-dismiss]');
let riskToastTimer = null;

function setRiskToastVisible(isVisible) {
  if (!riskToast) return;
  riskToast.classList.toggle('show', isVisible);
  riskToast.toggleAttribute('inert', !isVisible);
  riskToast.setAttribute('aria-hidden', String(!isVisible));
}

const riskToastMessage = riskToast?.querySelector('div');
riskToastMessage?.setAttribute('role', 'status');
riskToastMessage?.setAttribute('aria-live', 'polite');
setRiskToastVisible(false);

function rememberRiskNotice() {
  try { sessionStorage.setItem('qh-risk-notice-seen', '1'); } catch (_) {}
}

function hasSeenRiskNotice() {
  try { return sessionStorage.getItem('qh-risk-notice-seen') === '1'; } catch (_) { return false; }
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

riskOpeners.forEach(button => button.addEventListener('click', openRiskModal));
riskClosers.forEach(button => button.addEventListener('click', closeRiskModal));
riskDismiss?.addEventListener('click', hideRiskToast);

riskModal?.addEventListener('click', event => {
  const rect = riskModal.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeRiskModal();
});

if (!hasSeenRiskNotice()) {
  riskToastTimer = window.setTimeout(() => {
    riskToastTimer = null;
    if (!hasSeenRiskNotice()) setRiskToastVisible(true);
  }, reduceMotion ? 0 : 1400);
}
