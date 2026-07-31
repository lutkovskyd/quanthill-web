const errorPath = document.querySelector('[data-error-path]');

if (errorPath) {
  try {
    errorPath.textContent = decodeURI(window.location.pathname);
  } catch {
    errorPath.textContent = window.location.pathname;
  }
}
