const strategyDropdowns = [...document.querySelectorAll('[data-nav-dropdown]')];
const strategyDropdownViewport = window.matchMedia('(max-width: 1050px)');

function setStrategyDropdownOpen(dropdown, isOpen, { restoreFocus = false } = {}) {
  const toggle = dropdown?.querySelector('[data-nav-dropdown-toggle]');
  const panel = dropdown?.querySelector('[data-nav-dropdown-menu]');
  if (!dropdown || !toggle || !panel) return;

  dropdown.classList.toggle('is-open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', `${isOpen ? 'Скрыть' : 'Показать'} меню раздела «Стратегии»`);
  panel.setAttribute('aria-hidden', String(!isOpen));
  panel.toggleAttribute('inert', !isOpen);

  if (restoreFocus) toggle.focus();
}

function closeStrategyDropdowns(except = null) {
  strategyDropdowns.forEach(dropdown => {
    if (dropdown !== except) setStrategyDropdownOpen(dropdown, false);
  });
}

strategyDropdowns.forEach(dropdown => {
  const toggle = dropdown.querySelector('[data-nav-dropdown-toggle]');
  const panel = dropdown.querySelector('[data-nav-dropdown-menu]');
  const links = [...panel.querySelectorAll('a')];
  let closeTimer = 0;

  setStrategyDropdownOpen(dropdown, false);

  toggle.addEventListener('click', () => {
    const shouldOpen = !dropdown.classList.contains('is-open');
    closeStrategyDropdowns(dropdown);
    setStrategyDropdownOpen(dropdown, shouldOpen);
  });

  dropdown.addEventListener('mouseenter', () => {
    if (strategyDropdownViewport.matches) return;
    window.clearTimeout(closeTimer);
    closeStrategyDropdowns(dropdown);
    setStrategyDropdownOpen(dropdown, true);
  });

  dropdown.addEventListener('mouseleave', () => {
    if (strategyDropdownViewport.matches) return;
    closeTimer = window.setTimeout(() => setStrategyDropdownOpen(dropdown, false), 100);
  });

  dropdown.addEventListener('focusin', () => {
    if (document.activeElement === toggle) return;
    window.clearTimeout(closeTimer);
    closeStrategyDropdowns(dropdown);
    setStrategyDropdownOpen(dropdown, true);
  });

  dropdown.addEventListener('focusout', event => {
    if (!dropdown.contains(event.relatedTarget)) setStrategyDropdownOpen(dropdown, false);
  });

  dropdown.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dropdown.classList.contains('is-open')) {
      event.preventDefault();
      event.stopPropagation();
      setStrategyDropdownOpen(dropdown, false, { restoreFocus: true });
      return;
    }

    if (event.target === toggle && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setStrategyDropdownOpen(dropdown, true);
      links[event.key === 'ArrowDown' ? 0 : links.length - 1]?.focus();
      return;
    }

    const currentIndex = links.indexOf(event.target);
    if (currentIndex < 0 || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    links[(currentIndex + direction + links.length) % links.length].focus();
  });
});

document.addEventListener('pointerdown', event => {
  if (!event.target.closest('[data-nav-dropdown]')) closeStrategyDropdowns();
});

const resetStrategyDropdowns = () => closeStrategyDropdowns();
if (typeof strategyDropdownViewport.addEventListener === 'function') strategyDropdownViewport.addEventListener('change', resetStrategyDropdowns);
else strategyDropdownViewport.addListener(resetStrategyDropdowns);
