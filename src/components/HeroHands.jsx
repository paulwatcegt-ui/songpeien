import React, { useEffect, useRef, useState } from 'react';

export default function HeroHands() {
  const layer = useRef(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(layer.current.closest('.hero'));
    return () => observer.disconnect();
  }, []);

  return <div ref={layer} className={`hero-hands${ready ? ' is-ready' : ''}`} data-active={visible} aria-hidden="true">
    <img className="hand hand-human" src={`${import.meta.env.BASE_URL}media/reaching-hands-silver-v2.png`} alt="" fetchPriority="high" decoding="async" onLoad={() => setReady(true)}/>
    <img className="hand hand-robot" src={`${import.meta.env.BASE_URL}media/reaching-hands-silver-v2.png`} alt="" decoding="async"/>
  </div>;
}