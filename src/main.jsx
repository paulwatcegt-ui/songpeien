import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './hero.css';
import './contact.css';
import HeroHands from './components/HeroHands';
import DitherVeil from './components/DitherVeil';
import CursorEffects from './components/CursorEffects';

const email = 'songpeien@163.com';
const works = [
  { id: '01', kind: 'geometry', title: '秩序之外', en: 'BEYOND THE GRID', tag: '几何 / GEOMETRY', text: '圆、直线与留白。让规则的形状在不规则的排列中，产生新的节奏。', note: '以重复的圆环与错位关系，观察秩序和变化之间的张力。' },
  { id: '02', kind: 'type', title: '字有引力', en: 'TYPE IN MOTION', tag: '字体 / TYPOGRAPHY', text: '把文字当作形状，让大小、间距与方向成为另一种表达。', note: '用超大字形、紧密字距和裁切，探索文字从阅读到观看的转变。' },
  { id: '03', kind: 'color', title: '色彩的温度', en: 'A STUDY IN COLOR', tag: '色彩 / COLOR', text: '冷与暖，相遇与重叠。寻找不同颜色之间有趣的关系。', note: '用橙色、钴蓝与暖白的并置，观察色彩如何改变空间的感受。' },
];
function Spark({ className = '' }) {
  return <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M43 0h14l-2 32L77 9l10 10-23 24 36-1v15l-35-3 24 24-11 11-24-25 3 36H42l3-35-24 24-10-11 23-24L0 57V42l34 3L10 21 21 10l24 24z"/></svg>;
}
function Artwork({ kind }) {
  return <div className={`art art-${kind}`} aria-hidden="true">
    <span className="art-index">SP—{kind === 'geometry' ? '001' : kind === 'type' ? '002' : '003'} / FORM STUDY</span>
    <img className="art-image" src={`${import.meta.env.BASE_URL}media/work-${kind}.svg`} alt="" draggable="false"/>
    <span className="art-bottom">EXPERIMENTAL COMPOSITION <span>↗</span></span>
  </div>;
}
function App() {
  const [active, setActive] = useState('home');
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveal.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => reveal.observe(element));
    return () => { observer.disconnect(); reveal.disconnect(); };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);
  const openWork = (work, event) => { trigger.current = event.currentTarget; setSelected(work); };
  const closeWork = () => dialog.current?.close();
  const afterClose = () => { setSelected(null); trigger.current?.focus({ preventScroll: true }); };
  return <>
    <CursorEffects/>
    <a className="skip-link" href="#main">跳至正文</a>
    <header className="header"><div className="shell header-inner">
      <a className="logo" href="#home" aria-label="宋培恩，返回首页">s</a>
      <nav aria-label="主导航">
        <div className="nav-group"><a href="#work" aria-current={active === 'work' ? 'location' : undefined}>精选作品</a><a href="#contact" aria-current={active === 'contact' ? 'location' : undefined}>联系</a></div>
      </nav>
      <a className="header-mail" href={`mailto:${email}`} aria-label="给宋培恩发送邮件"><span className="mail-icon" aria-hidden="true">◇</span><span>打个招呼</span><span className="mail-arrow" aria-hidden="true">↗</span></a>
    </div></header>
    <main id="main">
      <section className="hero" id="home">
        <div className="hero-stage">
          <div className="hero-halo" aria-hidden="true"/>
          <div className="hero-title"><span className="hero-eyebrow">SONG PEIEN · PERSONAL SPACE</span><h1>宋培恩<span><em>保持好奇，</em>持续探索。</span></h1></div>
          <HeroHands/>
        </div>
        <div className="shell hero-footer">
          <div className="hero-intro"><span>Curiosity brings us closer.</span><p>让想法与可能相遇，<br/>在每一次尝试中，发现新的自己。</p></div>
          <a className="hero-scroll" href="#about" aria-label="向下浏览个人介绍"><span>↓</span></a>
          <div className="hero-tags" aria-label="快速浏览"><a href="#about">关于我</a><a href="#work">作品集</a><a href={`mailto:${email}`}>聊一聊 ↗</a></div>
        </div>
      </section>
      <section className="about section shell" id="about"><div className="section-kicker"><span>01 / ABOUT</span><span>关于这个空间</span></div><div className="about-grid reveal"><div className="monogram" aria-label="S 字母构图"><span>S</span><Spark/><small>SONG PEIEN / PERSONAL SPACE</small></div><div className="about-copy"><span className="small-label">A LITTLE ABOUT ME</span><h2>我是宋培恩。<br/>很高兴，<span>在这里遇见你。</span></h2><p>这是我的个人空间。用来收集作品、整理想法，也为新的探索留一个位置。</p><p>有些想法已经成形，有些还在路上。比起急着给它们一个定义，我更愿意保持开放，让好奇心带来下一步。</p><a className="text-link" href={`mailto:${email}`}>{email}<span>↗</span></a></div></div></section>
      <section className="works section shell" id="work"><div className="section-kicker"><span>02 / SELECTED EXPLORATIONS</span><span>一些有趣的尝试</span></div><div className="section-heading reveal"><h2>想法，<span className="serif">不止一种形状。</span></h2><p>从一个简单的念头出发。<br/>看看它能走到哪里。</p></div><div className="sample-notice"><span className="notice-dot"/> 以下为原创抽象构图 · 布局示意，非真实项目</div><div className="work-grid">{works.map(work => <button key={work.id} className={`work-card work-${work.kind} reveal`} onClick={event => openWork(work, event)} aria-haspopup="dialog" aria-label={`查看${work.title}，布局示意，非真实项目`}><Artwork kind={work.kind}/><div className="work-caption"><div><small>/{work.id}</small><h3>{work.title}</h3></div><span>{work.tag}<span className="work-arrow">↗</span></span></div><div className="work-sample">布局示意，非真实项目</div></button>)}</div></section>
      <section className="contact section contact-dither" id="contact">
        <DitherVeil className="contact-veil" src={`${import.meta.env.BASE_URL}media/contact-sculpture-iridescent-v2.png`} fit="contain" pattern="floyd" pixelSize={2} inkColor="#ece8f5" paperColor="#101014" revealRadius={200} softness={0.6} linger={1} brightness={0.025} clickBurst/>
        
        <div className="shell contact-inner">
          <div className="section-kicker"><span>03 / SAY HELLO</span><span>从一句你好开始</span></div>
          <div className="contact-body">
            <div className="contact-title reveal"><span className="small-label">SOMETHING ON YOUR MIND?</span><h2>有个想法？<br/>聊聊<span className="serif">看。</span><span className="contact-arrow">↗</span></h2></div>
            <div className="contact-art-caption"><span>LET’S MAKE SOMETHING HAPPEN.</span><p>一个新想法，<br/><small>也许就是下一段故事的开始。</small></p></div>
          </div>
          <div className="contact-details"><p>关于作品，关于想法，<br/>或者，只是打个招呼。</p><a className="contact-email" href={`mailto:${email}`}>{email}<span>↗</span></a></div>
          <footer><a className="footer-name" href="#home">宋培恩 <span>SONG PEIEN</span></a><span>© {new Date().getFullYear()} · 保持好奇，持续探索。</span><a href="#home">回到顶部 ↑</a></footer>
        </div>
      </section>
    </main>
    <dialog ref={dialog} className="work-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description" onClose={afterClose} onKeyDown={event => { if (event.key === 'Tab') { const closeButton = event.currentTarget.querySelector('button'); event.preventDefault(); closeButton?.focus(); } }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeWork(); } }}>
      {selected && <><div className="dialog-top"><span>FORM STUDY / {selected.id}</span><button onClick={closeWork} aria-label="关闭作品详情" autoFocus>关闭 ×</button></div><Artwork kind={selected.kind}/><div className="dialog-copy"><span className="small-label">{selected.en}</span><h2 id="dialog-title">{selected.title}</h2><p id="dialog-description">{selected.text}</p><p>{selected.note}</p><div className="sample-notice">布局示意，非真实项目。此构图用于呈现网站效果，后续可替换为真实作品。</div></div></>}
    </dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
