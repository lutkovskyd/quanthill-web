(() => {
  const triggers = Array.from(document.querySelectorAll('[data-video-popup]'));
  if (!triggers.length || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'article-video-modal';
  dialog.setAttribute('aria-label', 'Просмотр видеоролика');
  dialog.innerHTML = `
    <div class="article-video-modal-inner">
      <button class="article-video-close" type="button" aria-label="Закрыть видео">&times;</button>
      <div class="article-video-frame">
        <iframe title="Видеоролик Quant Hill" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
      </div>
    </div>`;
  document.body.append(dialog);

  const frame = dialog.querySelector('iframe');
  const closeButton = dialog.querySelector('.article-video-close');
  let activeTrigger = null;
  const hasWebOrigin = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  const playerOrigin = hasWebOrigin ? window.location.origin : 'https://quanthill.kg';
  const widgetReferrer = hasWebOrigin ? window.location.href : 'https://quanthill.kg/';

  const timeToSeconds = (value) => {
    if (!value) return 0;
    if (/^\d+$/.test(value)) return Number(value);
    const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
    if (!match) return 0;
    return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  };

  const getEmbedUrl = (source) => {
    const url = new URL(source, window.location.href);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com') {
      let videoId = '';
      if (host === 'youtu.be') videoId = url.pathname.slice(1).split('/')[0];
      else if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
      else if (url.pathname.startsWith('/embed/')) videoId = url.pathname.split('/')[2] || '';

      if (videoId) {
        const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
        embed.searchParams.set('autoplay', '1');
        embed.searchParams.set('enablejsapi', '1');
        embed.searchParams.set('origin', playerOrigin);
        embed.searchParams.set('widget_referrer', widgetReferrer);
        embed.searchParams.set('playsinline', '1');
        embed.searchParams.set('rel', '0');
        const start = timeToSeconds(url.searchParams.get('t') || url.searchParams.get('start'));
        if (start) embed.searchParams.set('start', String(start));
        return embed.toString();
      }
    }

    if (host === 'vk.com' && url.pathname === '/video_ext.php') {
      url.searchParams.set('autoplay', '1');
      return url.toString();
    }

    return source;
  };

  const closeVideo = () => {
    if (dialog.open) dialog.close();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      activeTrigger = trigger;
      frame.title = trigger.dataset.videoTitle || 'Видеоролик Quant Hill';
      frame.src = getEmbedUrl(trigger.href);
      dialog.showModal();
      closeButton.focus();
    });
  });

  closeButton.addEventListener('click', closeVideo);

  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closeVideo();
  });

  dialog.addEventListener('close', () => {
    frame.src = 'about:blank';
    activeTrigger?.focus();
    activeTrigger = null;
  });
})();
