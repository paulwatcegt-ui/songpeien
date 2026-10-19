import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

const DitherVeil = lazy(() => import('./DitherVeil'));

export default function DeferredDitherVeil({ className, ...props }) {
  const container = useRef(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setNearby(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className={className} aria-hidden="true">
    {nearby && <Suspense fallback={<img className="deferred-sculpture" src={props.src} alt="" decoding="async"/>}>
      <DitherVeil {...props}/>
    </Suspense>}
  </div>;
}
