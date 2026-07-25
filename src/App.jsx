import { useEffect, useRef, useState } from 'react';
import { copy, events, fighters } from './data';
import teaserVideo from '../tmp/teaser.MP4';
import logoImage from '../tmp/logo.jpg';
import narkotikPhoto from '../tmp/fighters/natkotik.png';
import brokerPhoto from '../tmp/fighters/BROKER.png';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const localUrl = (path) => `${BASE}${path}`;

const Arrow = () => <span className="arrow" aria-hidden="true">→</span>;

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 640 640" aria-hidden="true">
      <defs>
        <filter id="logo-luminance" colorInterpolationFilters="sRGB">
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  .2126 .7152 .0722 0 0" />
        </filter>
      </defs>
      <image href={logoImage} width="640" height="640" filter="url(#logo-luminance)" />
    </svg>
  );
}

function Logo() {
  return (
    <a className="logo" href={localUrl('/')} data-link aria-label="Weedboxing home">
      <LogoMark /><b>WEED BOXING<br />CLAN</b>
    </a>
  );
}

function SmokeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return undefined;

    const vertexSource = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;
    const fragmentSource = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.52;
        mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
        for (int i = 0; i < 6; i++) {
          value += amplitude * noise(p);
          p = rotation * p * 2.03 + 13.7;
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec2 p = (2.0 * gl_FragCoord.xy - resolution.xy) / min(resolution.x, resolution.y);
        p.x += 0.12;
        float drift = time * 0.055;
        vec2 flow = vec2(fbm(p * 0.8 + vec2(0.0, -drift)), fbm(p * 0.9 + vec2(4.2, -drift * 0.7)));
        float cloud = fbm(p * 1.35 + flow * 1.9 + vec2(0.0, -drift * 1.7));
        float detail = fbm(p * 3.1 - flow + vec2(drift * 0.25, -drift));
        float body = 1.0 - smoothstep(0.3, 1.75, length(p * vec2(0.72, 0.54)));
        float smoke = smoothstep(0.42, 0.79, cloud * 0.78 + detail * 0.28 + body * 0.18);
        vec3 cold = vec3(0.035, 0.04, 0.032);
        vec3 acid = vec3(0.34, 0.52, 0.12);
        vec3 color = mix(cold, acid, smoothstep(0.46, 0.9, cloud) * 0.48);
        gl_FragColor = vec4(color, smoke * body * 0.92);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'resolution');
    const time = gl.getUniformLocation(program, 'time');
    let animation;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now = 0) => {
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, now * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) animation = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animation);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
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

function Marquee({ text = 'WEEDBOXING · INDEPENDENT FIGHT SERIES · THAILAND · 3 × 3 · ' }) {
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
      <video className="hero-video" autoPlay loop muted playsInline preload="auto">
        <source src={teaserVideo} type="video/mp4" />
      </video>
      <div className="hero-video-shade" />
      <SmokeCanvas />
      <div className="hero-noise" />
      <div className="hero-copy">
        <p className="eyebrow reveal">{t.eyebrow}</p>
        <h1>
          <span>{t.heroA}</span>
          <span>{t.heroB}</span>
        </h1>
        <p className="hero-sub">{t.heroText}</p>
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
        </div>
      </div>
    </section>
  );
}

function Format({ t }) {
  return (
    <section className="format section">
      <SmokeCanvas />
      <div className="section-tag green"><i /> {t.formatTag}</div>
      <h2>{t.formatTitle}</h2>
      <div className="format-steps">
        {['PUFF', 'FIGHT', 'CHILL'].map((step, index) => <article key={step}><span>0{index + 1}</span><h3>{step}</h3><p>{t.formatSteps[index]}</p></article>)}
      </div>
    </section>
  );
}

function Archive({ t, full = false }) {
  const shown = events;
  return (
    <section className={`archive section ${full ? 'archive-full' : ''}`}>
      {!full && <><div className="section-tag"><i /> {t.archive}</div><h2 className="archive-heading">{t.archiveTitle}</h2></>}
      <div className="event-grid">
        {shown.map((event) => (
          <article className={`event-card ${event.status}`} key={event.id}>
            <div className="event-image"><img src={event.image} alt={`${event.title} ${event.city}`} /></div>
            <div className="event-meta"><span>№{event.number} · {event.date}</span><span>{event.city}</span></div>
            <h3>{event.title}</h3>
            <p>{event.card}</p>
            <a className="text-link" href={localUrl(`/events/${event.id}`)} data-link>{t.recap} <Arrow /></a>
          </article>
        ))}
      </div>
      {!full && <a href={localUrl('/events')} data-link className="outline-link">{t.allEvents} <Arrow /></a>}
    </section>
  );
}

const fighterPhotos = { 1: narkotikPhoto, 2: brokerPhoto };

function FighterPortrait({ fighter, eager = false }) {
  const initials = fighter.name.split(' ').slice(0, 2).map((word) => word[0]).join('');
  const photo = fighterPhotos[fighter.rank];

  return (
    <div className="fighter-portrait">
      <span>{initials}</span>
      {photo && <img src={photo} alt={fighter.name} loading={eager ? 'eager' : 'lazy'} />}
    </div>
  );
}

function FighterRecord({ fighter }) {
  return <span className="fighter-record"><b>{fighter.wins}</b>W <i>{fighter.draws}</i>D <i>{fighter.losses}</i>L</span>;
}

function Ranking({ t, full = false }) {
  const [query, setQuery] = useState('');
  const [weight, setWeight] = useState('all');
  const filtered = fighters.filter((fighter) => {
    return fighter.name.toLowerCase().includes(query.toLowerCase()) && (weight === 'all' || fighter.weight === weight);
  });
  const isFiltering = full && (query || weight !== 'all');
  const champion = fighters[0];
  const contenders = fighters.slice(1, 3);
  const topTen = full ? fighters.slice(3, 10) : fighters.slice(3, 6);
  const roster = fighters.slice(10);

  return (
    <section className={`ranking section ${full ? 'ranking-full' : ''}`}>
      {!full && <div className="section-tag green"><i /> {t.rankTag}</div>}
      {!full && <div className="ranking-head"><h2>{t.rankTitle}</h2><p>{t.rankSub}</p></div>}
      {full && <div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /><select value={weight} onChange={(e) => setWeight(e.target.value)}><option value="all">{t.filter}</option>{['70', '70-75', '75', '76', '80', '85', '90+'].map((value) => <option value={value} key={value}>{value} KG</option>)}</select></div>}
      {isFiltering ? (
        <div className="fighter-search-grid">
          {filtered.map((fighter) => <article className="rank-card" key={fighter.rank}><FighterPortrait fighter={fighter} /><div><p>№{fighter.rank} · {fighter.flag} · {fighter.weight} KG</p><h3>{fighter.name}</h3><FighterRecord fighter={fighter} /></div>{fighter.instagram && <a href={fighter.instagram} target="_blank" rel="noreferrer">Instagram</a>}</article>)}
        </div>
      ) : (
        <div className="rank-showcase">
          <article className="champion-card">
            <FighterPortrait fighter={champion} eager />
            <div className="champion-badge"><i /> {t.champion}</div>
            <div className="champion-info"><p>{champion.flag} · {champion.country} · {champion.weight} KG</p><h3>{champion.name}</h3><div><FighterRecord fighter={champion} /><span>{champion.fights} {t.fights}</span></div>{champion.instagram && <a href={champion.instagram} target="_blank" rel="noreferrer">{t.viewProfile} <Arrow /></a>}</div>
          </article>

          <div className="ranking-tier-title"><span>{t.contenders}</span><i /></div>
          <div className="contender-grid">
            {contenders.map((fighter) => <article className="contender-card" key={fighter.rank}><FighterPortrait fighter={fighter} /><div><p>№{fighter.rank} · {fighter.flag} · {fighter.weight} KG</p><h3>{fighter.name}</h3><FighterRecord fighter={fighter} /></div>{fighter.instagram && <a href={fighter.instagram} target="_blank" rel="noreferrer">Instagram</a>}</article>)}
          </div>

          <div className="ranking-tier-title"><span>{full ? t.topRanked : t.nextRanked}</span><i /></div>
          <div className="top-grid">
            {topTen.map((fighter) => <article className="rank-card" key={fighter.rank}><FighterPortrait fighter={fighter} /><div><p>№{fighter.rank} · {fighter.flag} · {fighter.weight} KG</p><h3>{fighter.name}</h3><FighterRecord fighter={fighter} /></div>{fighter.instagram && <a href={fighter.instagram} target="_blank" rel="noreferrer">Instagram</a>}</article>)}
          </div>

          {full && <><div className="ranking-tier-title roster-title"><span>{t.restRoster}</span><i /></div><div className="rank-table">{roster.map((fighter) => <div className="rank-row" key={fighter.rank}><span className="rank-number">{String(fighter.rank).padStart(2, '0')}</span><span className="fighter-name"><FighterPortrait fighter={fighter} /><b>{fighter.name}</b></span><span className="country"><em>{fighter.flag}</em>{fighter.country}</span><span>{fighter.weight} <small>KG</small></span><FighterRecord fighter={fighter} /><span>{fighter.instagram && <a href={fighter.instagram} target="_blank" rel="noreferrer">Instagram</a>}</span></div>)}</div></>}
        </div>
      )}
      {!full && <a href={localUrl('/fighters')} data-link className="outline-link light">{t.allFighters} <Arrow /></a>}
    </section>
  );
}

function Join({ t }) {
  return (
    <section className="join" id="join">
      <div className="join-ring"><i /><i /><i /></div>
      <div className="section-tag"><i /> {t.joinTag}</div>
      <h2>{t.joinTitle}</h2>
      <p>{t.joinText}</p>
      <MagneticButton href="mailto:fight@weedboxing.com" dark>{t.joinButton}</MagneticButton>
    </section>
  );
}

function Merch({ t }) {
  return (
    <section className="merch section" id="merch">
      <div className="section-tag"><i /> {t.merchTag}</div>
      <div className="merch-statement">
        <div><h2>{t.merchTitle}</h2><p>{t.merchText}</p><a href="https://t.me/kurnibratokk" target="_blank" rel="noreferrer" className="text-link">{t.buy} <Arrow /></a></div>
        <div className="merch-mark"><LogoMark /><span>DROP 001</span><b>WXB</b></div>
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
  return <section className="partners section"><div className="section-tag"><i /> {t.partners}</div><div><b>VENUES</b><b>MEDIA</b><b>FIGHT<br />GYMS</b><b>BRANDS</b><b>PRODUCTION</b></div></section>;
}

function Footer({ t }) {
  return (
    <footer>
      <div className="footer-top"><Logo /><h2>{t.footer}</h2><a href="#top">↑ TOP</a></div>
      <div className="footer-links"><div><a href={localUrl('/#about')} data-link>{t.nav[0]}</a><a href={localUrl('/events')} data-link>{t.nav[1]}</a><a href={localUrl('/fighters')} data-link>{t.nav[2]}</a><a href={localUrl('/#merch')} data-link>{t.nav[3]}</a></div><div><a href="https://www.instagram.com/weekend_boxing" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><a href="https://youtu.be/_ZRCpDyn8rI" target="_blank" rel="noreferrer">YOUTUBE ↗</a><a href="https://t.me/kurnibratokk" target="_blank" rel="noreferrer">TELEGRAM ↗</a></div></div>
      <div className="footer-word">WEEDBOXING</div>
      <div className="footer-bottom"><span>{t.rights}</span><span>THAILAND · EST. 2024</span></div>
    </footer>
  );
}

function Home({ t }) {
  return <main><Hero t={t} /><Marquee /><Manifesto t={t} /><Format t={t} /><Archive t={t} /><Ranking t={t} /><Join t={t} /><Merch t={t} /><Investors t={t} /><Partners t={t} /></main>;
}

function PageHero({ title, subtitle, type }) {
  return <section className={`page-hero ${type}`}><SmokeCanvas /><span>WEEDBOXING / {type}</span><h1>{title}</h1><p>{subtitle}</p></section>;
}

function EventsPage({ t }) {
  return <main><PageHero title={t.pageEvents} subtitle={t.pageEventsSub} type="events" /><Archive t={t} full /><Join t={t} /></main>;
}

function EventDetail({ event, t }) {
  if (!event) return <EventsPage t={t} />;

  return (
    <main className="event-detail">
      <section className="event-detail-hero">
        <img src={event.image} alt={`${event.title} ${event.city}`} />
        <div className="event-detail-shade" />
        <a href={localUrl('/events')} data-link>{t.eventBack} <Arrow /></a>
        <div><p>WEEDBOXING №{event.number} · {event.date}</p><h1>{event.title}</h1><span>{event.city} · {event.venue}</span></div>
      </section>
      <section className="event-facts section">
        <div><span>{t.eventAbout}</span><h2>{event.card}</h2></div>
        <dl><div><dt>DATE</dt><dd>{event.date}</dd></div><div><dt>CITY</dt><dd>{event.city}</dd></div><div><dt>VENUE</dt><dd>{event.venue}</dd></div></dl>
      </section>
      <section className="event-card-list section">
        <div className="section-tag green"><i /> FIGHT CARD</div>
        <div>{event.fights.map((fight, index) => <article key={fight}><span>{String(index + 1).padStart(2, '0')}</span><h3>{fight}</h3></article>)}</div>
      </section>
      <section className="event-gallery section">
        <div className="section-tag"><i /> {t.eventGallery}</div>
        <div className="gallery-grid">{event.gallery.map((image, index) => <img src={image} alt={`${event.title}, ${t.eventGallery.toLowerCase()} ${index + 1}`} loading="lazy" key={image} />)}</div>
        <a className="outline-link" href={event.source} target="_blank" rel="noreferrer">{t.eventSource} <Arrow /></a>
      </section>
      <Join t={t} />
    </main>
  );
}

function FightersPage({ t }) {
  return <main><PageHero title={t.pageFighters} subtitle={t.pageFightersSub} type="fighters" /><Ranking t={t} full /><Join t={t} /></main>;
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('wxb-lang') || 'en');
  const getPath = () => window.location.pathname.replace(BASE, '') || '/';
  const [path, setPath] = useState(getPath);
  const t = copy[lang];
  const eventMatch = path.match(/^\/events\/([^/]+)\/?$/);
  const activeEvent = eventMatch ? events.find((event) => event.id === eventMatch[1]) : null;

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
      {path === '/fighters' ? <FightersPage t={t} /> : path === '/events' ? <EventsPage t={t} /> : eventMatch ? <EventDetail event={activeEvent} t={t} /> : <Home t={t} />}
      <Footer t={t} />
    </div>
  );
}
