import { useEffect, useRef, useState } from 'react';

const canObserve = typeof IntersectionObserver !== 'undefined';

/**
 * Builds its children only when they are about to scroll into view, so a long page does not have to create every
 * section before the first screen can be drawn. Until then it is an empty block of `minHeight`, which keeps the
 * page length roughly right. Once built, the children stay.
 *
 * Safety net: if nobody scrolls there (or the browser restores a scroll position, or an in-page link jumps), the
 * children are built anyway during idle time `idleAfter` milliseconds after the page loaded. That is cheap, because
 * pictures and the map inside are still loaded only when they come near the screen.
 */
export default function LazyMount({ minHeight = '24rem', rootMargin = '700px 0px', idleAfter = 4000, children }) {
  const placeholder = useRef(null);
  const [built, setBuilt] = useState(!canObserve);

  useEffect(() => {
    if (built) return undefined;

    const build = () => setBuilt(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) build();
      },
      { rootMargin },
    );
    observer.observe(placeholder.current);

    let idle;
    const timer = idleAfter
      ? window.setTimeout(() => {
          idle = 'requestIdleCallback' in window ? window.requestIdleCallback(build, { timeout: 2000 }) : window.setTimeout(build, 0);
        }, idleAfter)
      : null;

    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
      if (idle !== undefined) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
        window.clearTimeout(idle);
      }
    };
  }, [built, rootMargin, idleAfter]);

  if (built) return children;
  return <div ref={placeholder} aria-hidden="true" style={{ minHeight }} />;
}
