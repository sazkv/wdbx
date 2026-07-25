import { useEffect, useRef, useState } from 'react';
import { copy, events, fighters } from './data';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const localUrl = (path) => `${BASE}${path}`;

const Arrow = ({ down = false }) => <span className={down ? 'arrow down' : 'arrow'}>↗</span>;

function Logo() {
  return (
    <a className="logo" href={localUrl('/')} data-link aria-label="Weedboxing home">
      <span>W</span><b>WEED<br />BOXING</b>
    </a>
  );
}

function SmokeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animation;
    let particles = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const makeParticle = (seed = false) => ({
      x: width * (0.25 + Math.random() * 0.55),
      y: seed ? Math.random() * height : height + 70,
      radius: 45 + Math.random() * 130,
      speed: 0.18 + Math.random() * 0.42,
      drift: -0.18 + Math.random() * 0.36,
      alpha: 0.012 + Math.random() * 0.026,
      life: Math.random() * Math.PI * 2,
      green: Math.random() > 0.54,
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (particles.length < 24) particles.push(makeParticle());
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.life) * 0.1;
        p.life += 0.006;
        p.radius += 0.08;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        const color = p.green ? '176, 255, 58' : '235, 238, 227';
        gradient.addColorStop(0, `rgba(${color}, ${p.alpha})`);
        gradient.addColorStop(0.45, `rgba(${color}, ${p.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      particles = particles.filter((p) => p.y + p.radius > -100);
      animation = requestAnimationFrame(draw);
    };

    resize();
    particles = Array.from({ length: 20 }, () => makeParticle(true));
    window.addEventListener('resize', resize);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animation);
    };
  }, []);

  return <canvas ref={canvasRef} className="smoke-canvas" aria-hidden="true" />;
}

function CursorGlow() {
  useEffect(() => {
    const root = document.documentElement;
    const move = (event) => {
      root.style.setProperty('--mouse-x', `${event.clientX}px`);
      root.style.setProperty('--mouse-y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return <div className="cursor-glow" aria-hidden="true" />;
}

function Header({ lang, setLang, t }) {
  const [open, setOpen] = useState(false);
  const links = [
    [localUrl('/#about'), t.nav[0]],
    [localUrl('/events'), t.nav[1]],
    [localUrl('/fighters'), t.nav[2]],
    [localUrl('/#merch'), t.nav[3]],
  ];

  return (
    <header className="header">
      <Logo />
      <nav className={open ? 'nav open' : 'nav'}>
        {links.map(([href, label]) => <a key={href} href={href} data-link onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <div className="langs">
          {['en', 'ru', 'th'].map((item) => <button className={lang === item ? 'active' : ''} key={item} onClick={() => setLang(item)}>{item}</button>)}
        </div>
        <a className="micro-cta" href={localUrl('/#join')} data-link>{t.apply} <Arrow /></a>
        <button className={open ? 'menu open' : 'menu'} onClick={() => setOpen(!open)} aria-label="Menu"><i /><i /></button>
      </div>
    </header>
  );
}

function Marquee({ text = 'WEEDBOXING · HIGH COMBAT · THAILAND · NO BAD TRIPS · ' }) {
  return <div className="marquee"><div>{text.repeat(4)}</div></div>;
}

function MagneticButton({ href, children, dark = false }) {
  const ref = useRef(null);
  const move = (e) => {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.12}px, ${(e.clientY - rect.top - rect.height / 2) * 0.12}px)`;
  };
  return <a ref={ref} href={href} data-link className={`round-button ${dark ? 'dark' : ''}`} onPointerMove={move} onPointerLeave={() => { ref.current.style.transform = ''; }}>{children}<Arrow /></a>;
}

function Hero({ t }) {
  return (
    <section className="hero">
      <SmokeCanvas />
      <div className="hero-noise" />
      <div className="hero-stamp">18+<small>HIGH<br />COMBAT</small></div>
      <div className="hero-copy">
        <p className="eyebrow reveal">{t.eyebrow}</p>
        <h1>
          <span>{t.heroA} <i>{t.heroB}</i></span>
          <span>{t.heroC} <i>{t.heroD}</i></span>
        </h1>
        <p className="hero-sub">{t.heroText}</p>
      </div>
      <div className="hero-bottom">
        <span>{t.scroll} ↓</span>
        <div>{t.rounds.map((item, i) => <span key={item}><b>0{i + 1}</b>{item}</span>)}</div>
      </div>
    </section>
  );
}

function Manifesto({ t }) {
  return (
    <section className="manifesto section" id="about">
      <div className="section-tag"><i /> {t.manifestoTag}</div>
      <div className="manifesto-grid">
        <h2>{t.manifesto}</h2>
        <div className="manifesto-copy">
          <p>{t.about}</p>
          <a className="text-link" href="#film">{t.watch} <Arrow /></a>
        </div>
      </div>
      <div className="rule-graphic">
        <span>03</span><i /><span>×</span><i /><span>03:00</span>
      </div>
    </section>
  );
}

function Film({ t }) {
  return (
    <section className="film" id="film">
      <video autoPlay loop muted playsInline poster="https://images.unsplash.com/photo-1522079302289-2f04f43e15b3?auto=format&fit=crop&w=1800&q=85">
        <source src={localUrl('/media/weedboxing-showreel.mp4')} type="video/mp4" />
      </video>
      <div className="film-overlay" />
      <button className="play" aria-label={t.watch}><span>▶</span><small>{t.watch}</small></button>
      <p className="film-caption">BANGKOK / PHUKET / PATTAYA <b>RAW FOOTAGE №08</b></p>
    </section>
  );
}

function NextEvent({ t }) {
  const event = events[0];
  return (
    <section className="next-event section">
      <div className="section-tag"><i /> {t.next}</div>
      <div className="event-poster">
        <img src={event.image} alt="Boxing fight under dramatic lights" />
        <div className="poster-shade" />
        <span className="poster-number">#{event.number}</span>
        <span className="poster-status"><i /> {t.announced}</span>
        <div className="poster-title">
          <p>{event.date} · {event.city}</p>
          <h2>{event.title}</h2>
          <span>{event.venue}</span>
        </div>
        <div className="versus"><span>NARKOTIK<small>RUS · 70 KG</small></span><b>VS</b><span>BRONSON<small>UKR · 90+ KG</small></span></div>
        <MagneticButton href="#tickets">{t.ticket}</MagneticButton>
      </div>
    </section>
  );
}

function Archive({ t, full = false }) {
  const shown = full ? events : events.slice(1);
  return (
    <section className={`archive section ${full ? 'archive-full' : ''}`}>
      {!full && <><div className="section-tag"><i /> {t.archive}</div><h2 className="archive-heading">{t.archiveTitle}</h2></>}
      <div className="event-grid">
        {shown.map((event) => (
          <article className={`event-card ${event.status}`} key={event.id}>
            <div className="event-image"><img src={event.image} alt={`${event.title} ${event.city}`} /><span>#{event.number}</span></div>
            <div className="event-meta"><span>{event.date}</span><span>{event.city}</span></div>
            <h3>{event.title}</h3>
            <p>{event.card}</p>
            <a className="text-link" href={localUrl(`/events#${event.id}`)}>{event.status === 'upcoming' ? t.ticket : t.recap} <Arrow /></a>
          </article>
        ))}
      </div>
      {!full && <a href={localUrl('/events')} data-link className="outline-link">{t.allEvents} <Arrow /></a>}
    </section>
  );
}

function Ranking({ t, full = false }) {
  const [query, setQuery] = useState('');
  const [weight, setWeight] = useState('all');
  const visible = (full ? fighters : fighters.slice(0, 6)).filter((fighter) => {
    return fighter.name.toLowerCase().includes(query.toLowerCase()) && (weight === 'all' || fighter.weight === weight);
  });

  return (
    <section className={`ranking section ${full ? 'ranking-full' : ''}`}>
      {!full && <div className="section-tag green"><i /> {t.rankTag}</div>}
      {!full && <div className="ranking-head"><h2>{t.rankTitle}</h2><p>{t.rankSub}</p></div>}
      {full && <div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /><select value={weight} onChange={(e) => setWeight(e.target.value)}><option value="all">{t.filter}</option>{['70', '70-75', '75', '76', '80', '85', '90+'].map((value) => <option value={value} key={value}>{value} KG</option>)}</select></div>}
      <div className="rank-table">
        <div className="rank-row rank-labels"><span>#</span><span>{t.fighter}</span><span>{t.country}</span><span>{t.weight}</span><span>{t.record}</span><span /></div>
        {visible.map((fighter) => (
          <div className="rank-row" key={fighter.rank}>
            <span className="rank-number">{String(fighter.rank).padStart(2, '0')}</span>
            <span className="fighter-name"><i>{fighter.name.charAt(0)}</i><b>{fighter.name}</b></span>
            <span className="country"><em>{fighter.flag}</em>{fighter.country}</span>
            <span>{fighter.weight} <small>KG</small></span>
            <span className="record"><b>{fighter.wins}</b>W · {fighter.draws}D · {fighter.losses}L</span>
            <span>{fighter.instagram && <a href={fighter.instagram} target="_blank" rel="noreferrer" aria-label={`${fighter.name} Instagram`}>↗</a>}</span>
          </div>
        ))}
      </div>
      {!full && <a href={localUrl('/fighters')} data-link className="outline-link light">{t.allFighters} <Arrow /></a>}
    </section>
  );
}

function Join({ t }) {
  return (
    <section className="join" id="join">
      <div className="join-glove">🥊</div>
      <div className="section-tag"><i /> {t.joinTag}</div>
      <h2>{t.joinTitle}</h2>
      <p>{t.joinText}</p>
      <MagneticButton href="mailto:fight@weedboxing.com" dark>{t.joinButton}</MagneticButton>
      <span className="scribble">YOU?</span>
    </section>
  );
}

const merch = [
  { name: 'SMOKE FIRST / HEAVY TEE', price: '$45', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85' },
  { name: 'HIGH COMBAT / HOODIE', price: '$85', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85' },
  { name: 'WXB / HAND WRAPS', price: '$25', image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=900&q=85' },
];

function Merch({ t }) {
  return (
    <section className="merch section" id="merch">
      <div className="section-tag"><i /> {t.merchTag}</div>
      <div className="merch-head"><h2>{t.merchTitle}</h2><span>DROP 001</span></div>
      <div className="merch-grid">
        {merch.map((item, index) => <article key={item.name}><div><img src={item.image} alt={item.name} /><span>0{index + 1}</span></div><h3>{item.name}</h3><p>{item.price} · {t.buy}</p></article>)}
      </div>
    </section>
  );
}

function Investors({ t }) {
  return (
    <section className="investors section">
      <div className="investor-inner">
        <div className="section-tag green"><i /> {t.investTag}</div>
        <h2>{t.investTitle}</h2>
        <p>{t.investText}</p>
        <a href="mailto:partners@weedboxing.com" className="acid-button">{t.investButton} <Arrow /></a>
      </div>
      <div className="investor-art"><span>WXB</span><i /><i /><i /></div>
    </section>
  );
}

function Partners({ t }) {
  return <section className="partners section"><div className="section-tag"><i /> {t.partners}</div><div><b>RAWAI <small>BOXING CLUB</small></b><b>HIGH<br />SEASON</b><b>MUAY <span>LAB</span></b><b>GREEN<br />ROOM</b><b>THAI<br />HUSTLE</b></div></section>;
}

function Footer({ t }) {
  return (
    <footer>
      <div className="footer-top"><Logo /><h2>{t.footer}</h2><a href="#top">↑ TOP</a></div>
      <div className="footer-links"><div><a href={localUrl('/#about')} data-link>{t.nav[0]}</a><a href={localUrl('/events')} data-link>{t.nav[1]}</a><a href={localUrl('/fighters')} data-link>{t.nav[2]}</a><a href={localUrl('/#merch')} data-link>{t.nav[3]}</a></div><div><a href="https://instagram.com" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><a href="https://youtube.com" target="_blank" rel="noreferrer">YOUTUBE ↗</a><a href="https://t.me" target="_blank" rel="noreferrer">TELEGRAM ↗</a></div></div>
      <div className="footer-word">WEEDBOXING</div>
      <div className="footer-bottom"><span>{t.rights}</span><span>THAILAND · 18+</span></div>
    </footer>
  );
}

function Home({ t }) {
  return <main><Hero t={t} /><Marquee /><Manifesto t={t} /><Film t={t} /><NextEvent t={t} /><Archive t={t} /><Ranking t={t} /><Join t={t} /><Merch t={t} /><Investors t={t} /><Partners t={t} /></main>;
}

function PageHero({ title, subtitle, type }) {
  return <section className={`page-hero ${type}`}><SmokeCanvas /><span>WEEDBOXING / {type}</span><h1>{title}</h1><p>{subtitle}</p></section>;
}

function EventsPage({ t }) {
  return <main><PageHero title={t.pageEvents} subtitle={t.pageEventsSub} type="events" /><Marquee text="FIGHT NIGHT · THAILAND · 3 × 3 · " /><Archive t={t} full /><Join t={t} /></main>;
}

function FightersPage({ t }) {
  return <main><PageHero title={t.pageFighters} subtitle={t.pageFightersSub} type="fighters" /><Ranking t={t} full /><Join t={t} /></main>;
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('wxb-lang') || 'en');
  const getPath = () => window.location.pathname.replace(BASE, '') || '/';
  const [path, setPath] = useState(getPath);
  const t = copy[lang];

  useEffect(() => {
    localStorage.setItem('wxb-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const navigate = (event) => {
      const link = event.target.closest('a[data-link]');
      if (!link) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      window.history.pushState({}, '', `${url.pathname}${url.hash}`);
      setPath(url.pathname.replace(BASE, '') || '/');
      requestAnimationFrame(() => {
        if (url.hash) document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    };
    const pop = () => setPath(getPath());
    document.addEventListener('click', navigate);
    window.addEventListener('popstate', pop);
    return () => { document.removeEventListener('click', navigate); window.removeEventListener('popstate', pop); };
  }, []);

  return (
    <div id="top" className="app">
      <CursorGlow />
      <Header lang={lang} setLang={setLang} t={t} />
      {path === '/fighters' ? <FightersPage t={t} /> : path === '/events' ? <EventsPage t={t} /> : <Home t={t} />}
      <Footer t={t} />
    </div>
  );
}
