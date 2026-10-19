import React, { useEffect, useRef, useState } from 'react';

// 两张图同源，靠 CSS 的 clip-path 左右裁切出"双手"，循环动画同样在 CSS 里。
const HAND_SRC = `${import.meta.env.BASE_URL}media/reaching-hands-silver-v2.webp`;

export default function HeroHands() {
  const layer = useRef(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hero = layer.current?.closest('.hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return <div ref={layer} className={`hero-hands${ready ? ' is-ready' : ''}`} data-active={visible} aria-hidden="true">
    <img className="hand hand-human" src={HAND_SRC} alt="" fetchPriority="high" decoding="async" onLoad={() => setReady(true)}/>
    <img className="hand hand-robot" src={HAND_SRC} alt="" decoding="async"/>
  </div>;
}