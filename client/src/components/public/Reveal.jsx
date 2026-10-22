import { Children, useEffect, useRef, useState } from 'react';

// One shared observer for every revealed element on the page (cheaper than one per element).
let observer;
const callbacks = new WeakMap();

const watch = (node, onVisible) => {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer.unobserve(entry.target);
      }
    },
    // fires as soon as any part is 8% above the bottom edge, so even very tall blocks always reveal
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  callbacks.set(node, onVisible);
  observer.observe(node);
};

/**
 * Fades its content in (and slides it a little) the first time it scrolls into view.
 *   variant: 'up' (default) | 'left' | 'right' | 'zoom' | 'fade'
 *   delay:   milliseconds to wait, for staggering neighbours
 * The motion itself is CSS (.reveal in index.css), which is switched off when the visitor prefers reduced motion.
 */
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, distance, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    watch(node, () => setVisible(true));
    return () => {
      callbacks.delete(node);
      observer?.unobserve(node);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, ...(distance !== undefined && { '--reveal-y': `${distance}px` }), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A grid or list whose children appear one after another (staggered within each row of `columns`).
 * Each child gets a wrapper (`itemClassName`, h-full by default so cards keep equal heights).
 */
export function RevealGrid({ as: Tag = 'div', className = '', itemClassName = 'h-full', columns = 4, step = 90, variant = 'up', children }) {
  return (
    <Tag className={className}>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={child.key ?? index} variant={variant} delay={(index % columns) * step} className={itemClassName}>
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
