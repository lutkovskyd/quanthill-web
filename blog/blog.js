const blogFilterButtons = [...document.querySelectorAll('[data-blog-filter]')];
const blogCards = [...document.querySelectorAll('[data-blog-card]')];
const blogFilterStatus = document.querySelector('[data-filter-status]');

blogFilterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.blogFilter;
    let visibleCount = 0;

    blogFilterButtons.forEach(item => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    blogCards.forEach(card => {
      const isVisible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (blogFilterStatus) {
      const noun = visibleCount === 1 ? 'материал' : visibleCount < 5 ? 'материала' : 'материалов';
      blogFilterStatus.textContent = `Показано: ${visibleCount} ${noun}`;
    }
  });
});
