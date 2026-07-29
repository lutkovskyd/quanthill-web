const heroVideo = document.querySelector('[data-hero-video-player]');
const heroVideoButtons = [...document.querySelectorAll('[data-hero-video]')];

if (heroVideo && heroVideoButtons.length) {
  let switchRequest = 0;

  heroVideoButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.classList.contains('is-active')) return;

      const request = ++switchRequest;

      heroVideoButtons.forEach(item => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      heroVideo.classList.add('is-switching');
      heroVideo.src = button.dataset.heroVideo;
      heroVideo.load();

      const revealVideo = () => {
        if (request !== switchRequest) return;
        heroVideo.classList.remove('is-switching');
      };

      heroVideo.addEventListener('loadeddata', revealVideo, { once: true });
      heroVideo.play().then(revealVideo).catch(revealVideo);
    });
  });
}
