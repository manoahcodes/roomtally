/**
 * Scroll reveals for static sections (Design_Brief §A.9, §B.16).
 *
 * The inline script in BaseLayout adds `reveal-ready` to <html> only when motion is
 * allowed and IntersectionObserver exists. That class is what hides `[data-reveal]`
 * elements, so a blocked or failed script never hides content. This module then marks
 * each element `.is-in` once, when it first comes into view.
 *
 * Never applied to the room form, results or anything a visitor is about to interact
 * with: only to static storytelling sections.
 */
export function initReveal(root: Document | HTMLElement = document): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const supported = 'IntersectionObserver' in window;

  if (reduce || !supported) {
    for (const item of items) item.classList.add('is-in');
    return () => {};
  }

  // Keyboard focus must never land on an element that is still transparent.
  const onFocus = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    target.closest<HTMLElement>('[data-reveal]')?.classList.add('is-in');
  };
  root.addEventListener('focusin', onFocus);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );

  for (const item of items) {
    // Anything already on screen settles immediately instead of waiting for a scroll.
    if (item.getBoundingClientRect().top < window.innerHeight * 0.92) {
      item.classList.add('is-in');
    } else {
      observer.observe(item);
    }
  }

  return () => {
    observer.disconnect();
    root.removeEventListener('focusin', onFocus);
  };
}
