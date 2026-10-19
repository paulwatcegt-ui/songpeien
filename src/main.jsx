import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './hero.css';
import './contact.css';
import HeroHands from './components/HeroHands';
import DitherVeil from './components/DeferredDitherVeil';
import CursorEffects from './components/CursorEffects';
import ExplorationArt from './components/ExplorationArt';

const email = 'songpeien@163.com';

const works = [
  {
    id: '01',
    kind: 'virtual',
    title: '虚拟人实验室',
    en: 'S — VIRTUAL CHARACTER',
    tag: '交互网页 / WEB',
    text: '让想象拥有形态，让角色拥有生命。在虚拟与现实之间，探索数字形象的无限可能。',
    note: '头部与眼部实时跟随鼠标，附设计过程手记；模型 8.07 MB 分块校验加载，配合打字机文案、移动端菜单和邮箱复制交互。',
    url: 'https://s-virtual-character.pages.dev/',
    cover: 'media/work-s-virtual-character-subject.webp'
  },
  {
    id: '02',
    kind: 'type',
    title: '字有引力',
    en: 'TYPE IN MOTION',
    tag: '字体 / TYPOGRAPHY',
    text: '把文字当作形状，让大小、间距与方向成为另一种表达。',
    note: '用超大字形、紧密字距和裁切，探索文字从阅读到观看的转变。'
  }
];

function Spark({ className = '' }) {
  return <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <path d="M43 0h14l-2 32L77 9l10 10-23 24 36-1v15l-35-3 24 24-11 11-24-25 3 36H42l3-35-24 24-10-11 23-24L0 57V42l34 3L10 21 21 10l24 24z"/>
  </svg>;
}

function Artwork({ kind, cover }) {
  // 已上线作品用真实截图；其余沿用本地抽象构图，仅作布局示意。
  if (cover) return <div className="art art-project" aria-hidden="true">
    <img
      className="project-cover"
      src={`${import.meta.env.BASE_URL}${cover}`}
      alt=""
      width="1440"
      height="960"
      loading="lazy"
      decoding="async"
    />
  </div>;

  return <div className={`art art-${kind}`} aria-hidden="true">
    <span className="art-index">SP—{kind === 'geometry' ? '001' : kind === 'type' ? '002' : '003'} / FORM STUDY</span>
    <img
      className="art-image"
      src={`${import.meta.env.BASE_URL}media/work-${kind}.svg`}
      alt=""
      draggable="false"
    />
    <span className="art-bottom">EXPERIMENTAL COMPOSITION <span>↗</span></span>
  </div>;
}

function CopyEmail({ className }) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setMessage('已复制！');
    } catch {
      setMessage('复制失败，请长按邮箱手动复制');
    }
    timer.current = setTimeout(() => setMessage(''), 2200);
  };

  return <span className="email-copy-wrap">
    <button
      type="button"
      className={`${className} email-copy`}
      onClick={copy}
      aria-label={`复制邮箱 ${email}`}
      title="点击复制邮箱"
    >
      <span className="email-inline-label">{message || email}</span>
    </button>
    <span className="email-copy-announcement" role="status" aria-live="polite">
      {message === '已复制！' ? '邮箱地址已复制。' : message}
    </span>
  </span>;
}

function SiteHeader({ active }) {
  return <header className="header">
    <div className="shell header-inner">
      <a className="logo" href="#home" aria-label="宋培恩，返回首页">s</a>
      <nav aria-label="主导航">
        <div className="nav-group">
          <a href="#work" aria-current={active === 'work' ? 'location' : undefined}>作品</a>
          <a href="#contact" aria-current={active === 'contact' ? 'location' : undefined}>联系</a>
        </div>
      </nav>
      <a className="header-mail" href={`mailto:${email}`} aria-label="给宋培恩发送邮件">
        <span className="mail-icon" aria-hidden="true">◇</span>
        <span>打个招呼</span>
        <span className="mail-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
  </header>;
}

function HeroSection() {
  return <section className="hero" id="home">
    <div className="hero-stage">
      <div className="hero-halo" aria-hidden="true"/>
      <div className="hero-title">
        <span className="hero-eyebrow">SONG PEIEN · PERSONAL SPACE</span>
        <h1><span><em>保持好奇，</em>持续探索</span></h1>
      </div>
      <HeroHands/>
    </div>
    <div className="shell hero-footer">
      <div className="hero-intro">
        <span>Curiosity brings us closer.</span>
        <p>让想法与可能相遇，<br/>在每一次尝试中，发现新的自己。</p>
      </div>
      <a className="hero-scroll" href="#about" aria-label="向下浏览个人介绍"><span>↓</span></a>
      <div className="hero-tags" aria-label="快速浏览">
        <a href="#about">关于我</a>
        <a href="#work">作品集</a>
        <a href="#contact">聊一聊 ↗</a>
      </div>
    </div>
  </section>;
}

function AboutSection() {
  return <section className="about section shell" id="about">
    <div className="section-kicker">
      <span>01 / ABOUT</span>
      <span>关于这个空间</span>
    </div>
    <div className="about-grid reveal">
      <ExplorationArt/>
      <div className="about-copy">
        <span className="small-label">A LITTLE ABOUT ME</span>
        <h2>我是宋培恩。<br/>很高兴，<span>在这里遇见你。</span></h2>
        <p>这是我的个人空间。用来收集作品、整理想法，也为新的探索留一个位置。</p>
        <p>有些想法已经成形，有些还在路上。比起急着给它们一个定义，我更愿意保持开放，让好奇心带来下一步。</p>
        <CopyEmail className="text-link email-text"/>
      </div>
    </div>
  </section>;
}

// 已上线作品：封面可点开详情，标题旁另给出站链接。
function LiveWorkCard({ work, onOpen }) {
  return <article className={`work-card work-${work.kind} reveal`}>
    <button
      className="project-preview-button"
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`查看${work.title}详情`}
    >
      <Artwork kind={work.kind} cover={work.cover}/>
    </button>
    <div className="work-caption">
      <div>
        <small>/{work.id}</small>
        <h3>{work.title}</h3>
      </div>
      <a
        className="project-card-link"
        href={work.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`访问${work.title}，新标签页打开`}
      >
        访问作品<span className="work-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
    <p className="project-summary">{work.text}</p>
    <div className="work-sample">已上线 · 点击图片查看详情</div>
  </article>;
}

// 布局示意作品：整卡可点开详情，无出站链接。
function StudyWorkCard({ work, onOpen }) {
  return <>
    <div className="section-heading typography-heading reveal">
      <h2>文字，<span className="serif">也有自己的引力。</span></h2>
      <p>从字形、间距到排列节奏。<br/>探索文字被阅读之外的表达。</p>
    </div>
    <button
      className={`work-card work-${work.kind} reveal`}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`查看${work.title}，布局示意，非真实项目`}
    >
      <Artwork kind={work.kind} cover={work.cover}/>
      <div className="work-caption">
        <div>
          <small>/{work.id}</small>
          <h3>{work.title}</h3>
        </div>
        <span>{work.tag}<span className="work-arrow">↗</span></span>
      </div>
      <div className="work-sample">布局示意，非真实项目</div>
    </button>
  </>;
}

function WorksSection({ onOpenWork }) {
  return <section className="works section shell" id="work">
    <div className="section-kicker">
      <span>02 / SELECTED EXPLORATIONS</span>
      <span>一些有趣的尝试</span>
    </div>
    <div className="section-heading reveal">
      <h2>虚拟形象，<span className="serif">让想象有了个性。</span></h2>
      <p>从角色塑造到交互表达。<br/>探索虚拟 IP 与人的连接。</p>
    </div>
    <div className="work-grid">
      {works.map(work => work.url
        ? <LiveWorkCard key={work.id} work={work} onOpen={event => onOpenWork(work, event)}/>
        : <StudyWorkCard key={work.id} work={work} onOpen={event => onOpenWork(work, event)}/>)}
    </div>
  </section>;
}

function ContactSection() {
  return <section className="contact section contact-dither" id="contact">
    <div className="shell contact-inner">
      <div className="section-kicker">
        <span>03 / SAY HELLO</span>
        <span>从一句你好开始</span>
      </div>
      <div className="contact-body">
        <div className="contact-title reveal">
          <span className="small-label">SOMETHING ON YOUR MIND?</span>
          <h2>有个想法？<br/>聊聊<span className="serif">看。</span><span className="contact-arrow">↗</span></h2>
        </div>
        <DitherVeil
          className="contact-veil"
          src={`${import.meta.env.BASE_URL}media/contact-sculpture-iridescent-v2.webp`}
          fit="contain"
          pattern="floyd"
          pixelSize={2}
          inkColor="#ece8f5"
          paperColor="#101014"
          revealRadius={200}
          softness={0.6}
          linger={1}
          brightness={0.025}
          clickBurst
        />
        <div className="contact-art-caption">
          <span>LET’S MAKE SOMETHING HAPPEN.</span>
          <p>一个新想法，<br/><small>也许就是下一段故事的开始。</small></p>
        </div>
      </div>
      <div className="contact-details">
        <p>关于作品，关于想法，<br/>或者，只是打个招呼。</p>
        <CopyEmail className="contact-email email-text"/>
      </div>
      <footer>
        <a className="footer-name" href="#home">宋培恩 <span>SONG PEIEN</span></a>
        <span>© {new Date().getFullYear()} · 保持好奇，持续探索。</span>
        <a href="#home">回到顶部 ↑</a>
      </footer>
    </div>
  </section>;
}

function WorkDialog({ dialogRef, work, onClose, onAfterClose }) {
  // 只有点在 dialog 盒子之外（即 ::backdrop 上）才关闭。
  const closeOnBackdrop = event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) onClose();
  };

  return <dialog
    ref={dialogRef}
    className="work-dialog"
    aria-labelledby={work ? 'dialog-title' : undefined}
    aria-describedby={work ? 'dialog-description' : undefined}
    onClose={onAfterClose}
    onClick={closeOnBackdrop}
  >
    {work && <>
      <div className="dialog-top">
        <span>{work.url ? 'WEB PROJECT' : 'FORM STUDY'} / {work.id}</span>
        <button onClick={onClose} aria-label="关闭作品详情" autoFocus>关闭 ×</button>
      </div>
      <Artwork kind={work.kind} cover={work.cover}/>
      <div className="dialog-copy">
        <span className="small-label">{work.en}</span>
        <h2 id="dialog-title">{work.title}</h2>
        <p id="dialog-description">{work.text}</p>
        <p>{work.note}</p>
        {work.url
          ? <a className="project-visit" href={work.url} target="_blank" rel="noopener noreferrer">
              访问作品 <span aria-hidden="true">↗</span>
              <span className="email-copy-announcement">（新标签页打开）</span>
            </a>
          : <div className="sample-notice">布局示意，非真实项目。此构图用于呈现网站效果，后续可替换为真实作品。</div>}
      </div>
    </>}
  </dialog>;
}

function App() {
  const [active, setActive] = useState('home');
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const trigger = useRef(null);

  // 滚动时同步当前栏目，并触发入场动画（命中后即停止观察）。
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

  // 打开弹窗时锁定页面滚动，关闭时还原为打开前的值。
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);

  const openWork = (work, event) => {
    trigger.current = event.currentTarget;
    setSelected(work);
  };
  const closeWork = () => dialog.current?.close();
  const afterClose = () => {
    setSelected(null);
    trigger.current?.focus({ preventScroll: true });
  };

  return <>
    <CursorEffects/>
    <a className="skip-link" href="#main">跳至正文</a>
    <SiteHeader active={active}/>
    <main id="main">
      <HeroSection/>
      <AboutSection/>
      <WorksSection onOpenWork={openWork}/>
      <ContactSection/>
    </main>
    <WorkDialog dialogRef={dialog} work={selected} onClose={closeWork} onAfterClose={afterClose}/>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
