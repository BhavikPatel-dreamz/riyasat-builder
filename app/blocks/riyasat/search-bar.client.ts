/**
 * Typewriter placeholder animation for serialized search bar markup.
 */
export function initSearchBars(root: ParentNode = document) {
  const bars = root.querySelectorAll<HTMLElement>(
    '.riyasat-search-bar:not([data-search-bar-init])',
  );

  bars.forEach((bar) => {
    bar.setAttribute('data-search-bar-init', 'true');

    const textEl = bar.querySelector<HTMLElement>('.riyasat-search-bar__placeholder-text');
    if (!textEl) return;

    let texts: string[] = [];
    try {
      const raw = bar.getAttribute('data-placeholders');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        texts = parsed
          .map((item) => (typeof item?.text === 'string' ? item.text.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      texts = [];
    }

    if (texts.length === 0) {
      texts = [...bar.querySelectorAll<HTMLElement>('.riyasat-search-bar__placeholder')]
        .map((node) => node.getAttribute('data-text')?.trim() ?? '')
        .filter(Boolean);
    }

    if (texts.length <= 1) return;

    let textIndex = 0;
    let charIndex = texts[0]?.length ?? 0;
    let isDeleting = false;
    let timer = 0;

    const TYPE_SPEED_MS = 70;
    const DELETE_SPEED_MS = 45;
    const PAUSE_FULL_MS = 1800;
    const PAUSE_EMPTY_MS = 250;

    const tick = () => {
      const currentText = texts[textIndex] ?? '';
      let delay = TYPE_SPEED_MS;

      if (!isDeleting) {
        if (charIndex < currentText.length) {
          charIndex += 1;
          delay = TYPE_SPEED_MS;
        } else {
          isDeleting = true;
          delay = PAUSE_FULL_MS;
        }
      } else if (charIndex > 0) {
        charIndex -= 1;
        delay = DELETE_SPEED_MS;
      } else {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        delay = PAUSE_EMPTY_MS;
      }

      textEl.textContent = currentText.slice(0, charIndex);
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, PAUSE_FULL_MS);

    bar.addEventListener(
      'riyasat:search-bar-destroy',
      () => {
        window.clearTimeout(timer);
      },
      { once: true },
    );
  });
}
