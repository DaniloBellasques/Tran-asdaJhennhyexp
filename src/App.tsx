import { useState, useEffect, useRef, useCallback } from 'react'
import Booking from './Booking'
import BraidCalculator from './BraidCalculator'
import AdminDashboard from './AdminDashboard'
import LiveAdmin from './LiveAdmin'
import { isLive } from './api'
import { Privacy, Terms, Payments, MyData, MyBookingPage } from './Legal'
import { LEGAL, isPending } from './legalConfig'
import {
  Reveal, Logo, WhatsAppFloat, WHATSAPP_URL,
  ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, CloseIcon, MenuIcon,
  PlayIcon, PauseIcon, StarIcon, InstagramIcon, TikTokIcon, PinIcon, WhatsAppIcon,
} from './ui'
import heroJhenny from './assets/hero-jhenny.webp'
import p01 from './assets/portfolio-01-barrel.jpg'
import p02 from './assets/portfolio-02-nago-com-jumbo.jpg'
import p03 from './assets/portfolio-03-bantu-knots.jpg'
import p04 from './assets/portfolio-04-nago-desenhada.jpg'
import p05 from './assets/portfolio-05-box-braids.jpg'
import p06 from './assets/portfolio-06-trancas-soltas.jpg'
import p07 from './assets/portfolio-07-tiara.jpg'
import p08 from './assets/portfolio-08-boxeadora.jpg'
import p09 from './assets/portfolio-09-gipsy-braids.jpg'
import p10 from './assets/portfolio-10-twist-enraizado.jpg'

// ─── Conteúdo (preservado do site original) ───────────────────────────────────
const IMG = {
  hero: heroJhenny,
  gallery: [
    { url: p01, label: 'Barrel',                   alt: 'Penteado Barrel' },
    { url: p02, label: 'Nagô com Jumbo',            alt: 'Nagô desenhada com jumbo' },
    { url: p03, label: 'Bantu Knots',               alt: 'Bantu Knots' },
    { url: p04, label: 'Nagô Desenhada',            alt: 'Nagô desenhada' },
    { url: p05, label: 'Box Braids',                alt: 'Box Braids' },
    { url: p06, label: 'Tranças Soltas',            alt: 'Tranças soltas sem jumbo' },
    { url: p07, label: 'Tiara',                     alt: 'Tiara' },
    { url: p08, label: 'Boxeadora com Jumbo',       alt: 'Boxeadora com jumbo' },
    { url: p09, label: 'Gipsy Braids',              alt: 'Gipsy Braids' },
    { url: p10, label: 'Twist Enraizado',           alt: 'Twist Enraizado' },
  ],
  carousel: [p05, p06, p04, p09, p03],
}

const services = [
  { name: 'Box Braids',      duration: '4–6h',  price: 'A partir de R$ 250', desc: 'Tranças soltas que combinam estilo atemporal com proteção total dos fios.' },
  { name: 'Knotless Braids', duration: '5–7h',  price: 'A partir de R$ 320', desc: 'Técnica sem nó na raiz para um resultado mais natural, leve e confortável.' },
  { name: 'Tranças Nagô',    duration: '2–4h',  price: 'A partir de R$ 180', desc: 'Tranças coladas com padrões geométricos executados com precisão artesanal.' },
  { name: 'Fulani Braids',   duration: '3–5h',  price: 'A partir de R$ 280', desc: 'Mistura sofisticada de tranças soltas e coladas com detalhes de missangas.' },
  { name: 'Goddess Braids',  duration: '3–5h',  price: 'A partir de R$ 220', desc: 'Tranças volumosas com ondas expostas para um visual imponente e feminino.' },
  { name: 'Micro Braids',    duration: '6–10h', price: 'A partir de R$ 380', desc: 'Tranças ultra finas para um visual sofisticado e duradouro.' },
]

const testimonials = [
  { name: 'Cris', city: 'Itanhaém',      text: 'Ótima trancista, sempre que posso eu marco tranças pra fazer com a Jhenny, parabéns continue esse trabalho incrível!', stars: 5 },
  { name: 'Sarah Rocha',   city: 'Itanhaém', text: 'Incrível o trabalho dessa trancista! Profissional muito talentosa, atenciosa e com um cuidado impecável nos detalhes. Recomendo de olhos fechados!!', stars: 5 },
  { name: 'Geovanna Araújo',     city: 'Itanhaém', text: 'Trabalho impecável, atendimento excelente muito educada e atenciosa, sem contar a perfeição que fica o trabalho dela sou fã do trabalho dessa maravilhosa 💜💜', stars: 5 },
]

const FAQ_ITEMS = [
  { q: 'Quanto tempo dura uma sessão de tranças?',           a: 'Depende do estilo e do comprimento. Tranças Nagô levam entre 2 e 4 horas; Box Braids longas com jumbo podem levar até 8 horas. Informamos o tempo estimado no momento do agendamento.' },
  { q: 'Preciso levar o meu próprio cabelo (jumbo)?',        a: 'Não! Você pode comprar o Jumbo diretamente no estúdio. Trabalhamos com marcas de qualidade. Se preferir trazer o seu, orientamos sobre quantidade e tipo antes da sessão.' },
  { q: 'Quanto tempo as tranças duram?',                     a: 'Com os cuidados corretos, de 4 a 8 semanas. Enviamos um guia de cuidados no WhatsApp após cada atendimento.' },
  { q: 'Como funciona o pagamento do sinal?',                a: 'Cobramos 30% do valor total como sinal via PIX para garantir o horário. O saldo restante é pago no dia do atendimento, em dinheiro, PIX ou cartão.' },
  { q: 'Posso cancelar ou remarcar meu horário?',            a: 'Sim! Aceitamos cancelamentos e remarcações com até 24 horas de antecedência sem custo. Reagendamentos em menos de 24h podem perder o sinal.' },
  { q: 'Atende crianças?',                                   a: 'Sim, atendemos crianças a partir de 5 anos. O ambiente é tranquilo e toda a equipe é muito carinhosa com as nossas pequeninhas clientes.' },
]

const INSTA = 'https://www.instagram.com/trancasdajhenny?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=='
const ADDRESS = 'Av. Manoel Francisco Lisboa, 442B — Belas Artes'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Av. Manoel Francisco Lisboa, 442B Belas Artes')}`

const REELS = [
  { shortcode: 'DXRkUVRkUzD', thumb: p05, title: 'Transformação completa ✨' },
  { shortcode: 'DNHCOuYRCsu', thumb: p09, title: 'Do zero ao resultado 🔥'  },
  { shortcode: 'DYAI5ApJFt9', thumb: p04, title: 'Técnica exclusiva 💜'     },
  { shortcode: 'DIJxTtYRCZa', thumb: p03, title: 'Processo real e detalhado'},
]
const INTERVAL_MS = 4000

const NAV_LINKS = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#portfolio', label: 'Portfólio' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#faq', label: 'Dúvidas' },
]

// ─── Cabeçalho de seção ───────────────────────────────────────────────────────
function SectionHead({ eyebrow, title, intro, align = 'left', light = false }: {
  eyebrow: string; title: React.ReactNode; intro?: string; align?: 'left' | 'center'; light?: boolean
}) {
  return (
    <Reveal className={align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className={`h-display mt-5 text-[clamp(2.4rem,5.4vw,4rem)] ${light ? 'text-orchid' : 'text-white'}`}>{title}</h2>
      {intro && <p className={`mt-5 leading-relaxed text-[1.02rem] ${light ? 'text-orchid/70' : 'text-white/65'}`}>{intro}</p>}
    </Reveal>
  )
}


// ─── Como funciona (descreve o fluxo real do site) ────────────────────────────
function HowItWorks({ onCTA }: { onCTA: () => void }) {
  const steps = [
    ['01', 'Monte sua trança', 'Escolha estilo, comprimento, espessura e extras. O valor e o tempo aparecem na hora.'],
    ['02', 'Reserve o horário', 'Veja os dias e horários disponíveis e selecione o que combina com você.'],
    ['03', 'Garanta com o sinal', 'Pague 30% via PIX para reservar. O restante é acertado no dia.'],
    ['04', 'Receba os detalhes', 'Envie o resumo pelo WhatsApp e adicione o horário ao seu calendário.'],
  ]
  return (
    <section id="como-funciona" className="relative bg-plum py-24 md:py-32 border-y border-white/8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Como funciona" title={<>Agendar é <strong className="text-lavender">simples</strong></>} intro="Do primeiro clique ao horário confirmado, em poucos passos e direto pelo celular." />
        <ol className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-white/10 rounded-3xl overflow-hidden border border-white/10">
          {steps.map(([n, t, d], i) => (
            <li key={n} className="bg-plum p-7 md:p-8">
              <Reveal delay={i * 90}>
                <span className="h-display text-5xl text-lilac/70">{n}</span>
                <h3 className="mt-6 text-lg font-semibold text-white">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="mt-10"><button onClick={onCTA} className="btn btn-primary">Começar agora <ArrowRight /></button></div>
      </div>
    </section>
  )
}

// ─── Hero (tela cheia, foto em fundo) ─────────────────────────────────────────
function Hero({ onCTA }: { onCTA: () => void }) {
  const [idx, setIdx] = useState(0)
  const imgs = IMG.carousel
  const labels = ['Box Braids', 'Tranças Soltas', 'Nagô Desenhada', 'Gipsy Braids', 'Bantu Knots']

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIdx(i => (i + 1) % imgs.length), 6500)
    return () => clearInterval(id)
  }, [imgs.length])

  return (
    <section className="relative min-h-[100svh] flex items-end overflow-hidden bg-ink" aria-roledescription="carrossel" aria-label="Trabalhos em destaque">
      {imgs.map((src, i) => (
        <img
          key={i} src={src} alt={i === idx ? labels[i] : ''} aria-hidden={i !== idx}
          loading={i === 0 ? 'eager' : 'lazy'} decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms]"
          style={{ opacity: i === idx ? 1 : 0, objectPosition: 'center 35%', animation: 'kenburns 16s ease-in-out infinite alternate' }}
        />
      ))}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/35" />
      <div aria-hidden className="absolute inset-0 bg-brand/25 mix-blend-multiply" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl w-full px-5 sm:px-8 pt-40 pb-14 md:pb-20">
        <p className="anim-fade-up eyebrow !text-lavender">Tranças da Jhenny</p>
        <h1 className="anim-fade-up h-display mt-6 max-w-4xl text-[clamp(2.5rem,6.6vw,5.8rem)] text-white" style={{ animationDelay: '80ms' }}>
          Sua autoestima renovada com <strong className="text-lavender">tranças impecáveis</strong>
        </h1>
        <p className="anim-fade-up mt-7 max-w-md text-[1.05rem] leading-relaxed text-white/75" style={{ animationDelay: '160ms' }}>
          Leves, duradouras e feitas sob medida para exaltar a sua beleza. Agende com quem entende de verdade.
        </p>
        <div className="anim-fade-up mt-10 flex flex-col sm:flex-row gap-3.5" style={{ animationDelay: '240ms' }}>
          <button onClick={onCTA} className="btn btn-primary">Agendar horário <ArrowRight /></button>
          <a href="#portfolio" className="btn btn-ghost">Conhecer as tranças</a>
        </div>

        <div className="anim-fade-up mt-14 flex flex-col-reverse md:flex-row md:items-end md:justify-between gap-8 border-t border-white/15 pt-6" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center gap-1" role="group" aria-label="Escolher foto">
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Ver ${labels[i]}`} aria-current={i === idx} className="h-8 px-1 flex items-center">
                <span className="block h-[3px] rounded-full transition-all duration-500" style={{ width: i === idx ? 36 : 14, background: i === idx ? '#dcc8f5' : 'rgba(255,255,255,0.4)' }} />
              </button>
            ))}
            <span className="ml-3 text-xs uppercase tracking-[0.2em] text-white/60" aria-live="polite">{labels[idx]}</span>
          </div>
          <dl className="flex gap-10">
            {[['500+', 'Clientes'], ['8', 'Anos de exp.'], ['20+', 'Técnicas']].map(([n, l]) => (
              <div key={l} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/55">{l}</dt>
                <dd className="h-display text-[2.2rem] leading-none text-white">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

// ─── Faixa de fotos ───────────────────────────────────────────────────────────
function PhotoStrip() {
  const six = [4, 5, 3, 8, 2, 0].map(i => IMG.gallery[i])
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 bg-ink" aria-label="Trabalhos recentes">
      {six.map((img, i) => (
        <Reveal key={i} delay={i * 60} className="group relative aspect-[3/4] overflow-hidden">
          <img src={img.url} alt={img.alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
          <span aria-hidden className="absolute inset-0 bg-brand/25 mix-blend-multiply opacity-100 group-hover:opacity-0 transition-opacity duration-700" />
        </Reveal>
      ))}
    </div>
  )
}

// ─── Serviços (lista) ─────────────────────────────────────────────────────────
function Services({ onCTA }: { onCTA: () => void }) {
  return (
    <section id="servicos" className="bg-plum py-24 md:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 md:mb-20">
          <SectionHead eyebrow="Serviços" title={<>Cada técnica, <strong className="text-lavender">uma assinatura</strong></>} intro="Executadas com precisão artesanal para um resultado que dura e impressiona. Escolha o estilo e simule o seu valor." />
          <Reveal><button onClick={onCTA} className="btn btn-primary">Simular meu preço <ArrowRight /></button></Reveal>
        </div>

        <ol className="border-t border-white/15">
          {services.map((s, i) => (
            <Reveal as="li" key={s.name} delay={i * 40} className="border-b border-white/15">
              <button
                onClick={onCTA}
                aria-label={`${s.name}, ${s.price}, duração ${s.duration}. Simular e agendar`}
                className="group w-full text-left grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_1.1fr_1.3fr_11rem_3rem] gap-x-4 md:gap-x-8 gap-y-2 items-baseline py-7 md:py-9 transition-all duration-500 hover:bg-white/[0.03] hover:md:pl-4"
              >
                <span className="h-display text-lg text-lilac/70">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-display text-[clamp(1.7rem,3.6vw,3rem)] text-white group-hover:text-lavender transition-colors">{s.name}</span>
                <span className="col-start-2 col-span-2 md:col-start-auto md:col-span-1 md:order-none text-[0.95rem] leading-relaxed text-white/60 max-w-md">{s.desc}</span>
                <span className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto text-right md:text-left">
                  <span className="block text-sm font-semibold text-white">{s.price}</span>
                  <span className="block mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-white/45">{s.duration}</span>
                </span>
                <span aria-hidden className="hidden md:flex justify-end text-lavender transition-transform duration-300 group-hover:translate-x-1"><ArrowRight className="w-5 h-5" /></span>
              </button>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── Portfólio + lightbox ─────────────────────────────────────────────────────
function Lightbox({ index, onClose, onIndex }: { index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const n = IMG.gallery.length
  const img = IMG.gallery[index]
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const prev = useCallback(() => onIndex((index - 1 + n) % n), [index, n, onIndex])
  const next = useCallback(() => onIndex((index + 1) % n), [index, n, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }, [onClose, prev, next])

  const touchX = useRef<number | null>(null)

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Foto ${index + 1} de ${n}: ${img.label}`}
      className="anim-fade-in fixed inset-0 z-[70] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
      onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) dx < 0 ? next() : prev()
        touchX.current = null
      }}
    >
      <button ref={closeRef} onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-colors"><CloseIcon /></button>
      <button onClick={e => { e.stopPropagation(); prev() }} aria-label="Foto anterior" className="hidden sm:flex absolute left-6 w-12 h-12 rounded-full border border-white/20 text-white items-center justify-center hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
      <button onClick={e => { e.stopPropagation(); next() }} aria-label="Próxima foto" className="hidden sm:flex absolute right-6 w-12 h-12 rounded-full border border-white/20 text-white items-center justify-center hover:bg-white/10 transition-colors"><ChevronRight className="w-5 h-5" /></button>

      <figure className="relative max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img key={index} src={img.url} alt={img.alt} className="anim-fade-in max-h-[78svh] max-w-full w-auto rounded-2xl object-contain shadow-[0_40px_90px_-20px_rgba(108,43,217,0.5)]" />
        <figcaption className="mt-5 text-center">
          <p className="h-display italic text-2xl text-white">{img.label}</p>
          <p className="mt-1 text-xs tracking-[0.2em] text-white/50">{index + 1} / {n}</p>
        </figcaption>
      </figure>
    </div>
  )
}

function Portfolio({ onCTA }: { onCTA: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement | null>(null)
  const nudge = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * Math.max(320, scroller.current.clientWidth * 0.6), behavior: 'smooth' })

  return (
    <section id="portfolio" className="bg-ink py-24 md:py-40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
        <SectionHead eyebrow="Portfólio" title={<>Nosso trabalho, <strong className="text-lavender">em detalhes</strong></>} intro="Deslize para ver mais. Toque em uma foto para ampliar." />
        <Reveal className="flex items-center gap-3">
          <button onClick={() => nudge(-1)} aria-label="Fotos anteriores" className="hidden md:flex w-12 h-12 rounded-full border border-white/25 items-center justify-center text-white hover:bg-white/10 transition-colors"><ChevronLeft /></button>
          <button onClick={() => nudge(1)} aria-label="Próximas fotos" className="hidden md:flex w-12 h-12 rounded-full border border-white/25 items-center justify-center text-white hover:bg-white/10 transition-colors"><ChevronRight /></button>
          <button onClick={onCTA} className="btn btn-ghost">Agendar o meu <ArrowUpRight /></button>
        </Reveal>
      </div>

      <div ref={scroller} tabIndex={0} aria-label="Galeria de tranças" className="no-scrollbar flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2" style={{ paddingLeft: 'max(1.25rem, calc((100vw - 80rem) / 2 + 2rem))' }}>
        {IMG.gallery.map((img, i) => (
          <button
            key={i} onClick={() => setOpen(i)} aria-label={`Ampliar foto: ${img.label}`}
            className="group relative snap-start shrink-0 w-[72vw] sm:w-[20rem] lg:w-[24rem] aspect-[3/4] overflow-hidden bg-card"
          >
            <img src={img.url} alt={img.alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between text-left">
              <span className="h-display text-lg text-white">{img.label}</span>
              <span aria-hidden className="text-lavender opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight /></span>
            </span>
          </button>
        ))}
        <span aria-hidden className="shrink-0 w-4 md:w-12" />
      </div>
      {open !== null && <Lightbox index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </section>
  )
}

// ─── Título empilhado + imagens ───────────────────────────────────────────────
function Experience({ onCTA }: { onCTA: () => void }) {
  const lines: [string, number, boolean][] = [
    ['Muito', 0, false], ['além', 1, false], ['de uma trança,', 2, false], ['uma', 1, false],
    ['experiência', 0, true], ['pensada', 2, false], ['para você', 1, true],
  ]
  return (
    <section className="relative bg-plum py-24 md:py-40 overflow-hidden">
      <div aria-hidden className="absolute -top-20 right-0 w-[40rem] h-[40rem] rounded-full blur-[130px] opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle,#6c2bd9,transparent 70%)' }} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <Reveal>
          <h2 className="h-display text-[clamp(2.4rem,6vw,5.2rem)] text-white leading-[1.04]" aria-label="Muito além de uma trança, uma experiência pensada para você">
            {lines.map(([t, step, bold]) => (
              <span key={t} aria-hidden className="block" style={{ paddingLeft: `${step * 6}%` }}>
                {bold ? <strong className="text-lavender">{t}</strong> : t}
              </span>
            ))}
          </h2>
          <button onClick={onCTA} className="btn btn-primary mt-12">Agendar horário <ArrowRight /></button>
        </Reveal>
        <Reveal delay={120} className="relative grid grid-cols-5 gap-3 md:gap-4">
          <div className="col-span-3 aspect-[3/4] overflow-hidden"><img src={p07} alt="Penteado Tiara" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
          <div className="col-span-2 aspect-[3/5] mt-14 overflow-hidden"><img src={p10} alt="Twist Enraizado" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Reels (lógica do carrossel preservada) ───────────────────────────────────
function VideoCarousel() {
  const [active,  setActive]  = useState(0)
  const [leaving, setLeaving] = useState<number | null>(null)
  const [dir,     setDir]     = useState<'next' | 'prev'>('next')
  const [paused,  setPaused]  = useState(false)
  const [igOk,    setIgOk]    = useState(false)
  const [tick,    setTick]    = useState(0)
  const busy        = useRef(false)
  const activeRef   = useRef(0)
  const touchStartX = useRef<number | null>(null)
  const n = REELS.length

  activeRef.current = active

  const navigate = useCallback((idx: number, d: 'next' | 'prev') => {
    if (busy.current) return
    busy.current = true
    setDir(d)
    setLeaving(activeRef.current)
    setActive(idx)
    setTick(t => t + 1)
    setTimeout(() => { setLeaving(null); busy.current = false }, 420)
  }, [])

  const goNext = useCallback(() => navigate((activeRef.current + 1) % n, 'next'), [navigate, n])
  const goPrev = useCallback(() => navigate((activeRef.current - 1 + n) % n, 'prev'), [navigate, n])
  const goTo   = useCallback((i: number) => {
    const cur = activeRef.current
    if (i === cur) return
    const fwd = (i - cur + n) % n
    navigate(i, fwd <= n / 2 ? 'next' : 'prev')
  }, [navigate, n])

  useEffect(() => {
    if (paused) return
    const id = setInterval(goNext, INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, goNext])

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 44) dx < 0 ? goNext() : goPrev()
    touchStartX.current = null
  }

  const enterAnim = dir === 'next' ? 'slideInFromRight' : 'slideInFromLeft'
  const exitAnim  = dir === 'next' ? 'slideOutToLeft'   : 'slideOutToRight'
  const CARD_ANIM = '420ms cubic-bezier(0.22,1,0.36,1) forwards'

  return (
    <section className="relative bg-plum py-24 md:py-32 select-none overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] rounded-full blur-[130px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6c2bd9, transparent 70%)' }} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-[1fr_auto] gap-14 lg:gap-24 items-center">
        <div>
          <SectionHead eyebrow="Reels & transformações" title={<>Assista ao <em className="text-lilac font-medium">processo</em></>} intro="Do primeiro nó ao resultado final — veja o cuidado em cada etapa do atendimento." />
          <Reveal delay={100} className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPaused(p => !p)}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label={paused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button onClick={goPrev} aria-label="Reel anterior" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><ChevronLeft /></button>
            <button onClick={goNext} aria-label="Próximo reel" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"><ChevronRight /></button>
            <a href={INSTA} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm ml-1"><InstagramIcon className="w-4 h-4" /> Ver no Instagram</a>
          </Reveal>
        </div>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-lilac/40 shadow-[0_40px_90px_-20px_rgba(108,43,217,0.6)]"
            style={{ width: 'min(320px, 100%)', minHeight: 568 }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {leaving !== null && (
              <div className="absolute inset-0" style={{ animation: `${exitAnim} ${CARD_ANIM}`, zIndex: 1 }}>
                <ReelFrame ok={igOk} onOk={() => setIgOk(true)} reel={REELS[leaving]} />
              </div>
            )}
            <div key={`card-${active}`} className="absolute inset-0" style={{ animation: `${enterAnim} ${CARD_ANIM}`, zIndex: 2 }}>
              <ReelFrame ok={igOk} onOk={() => setIgOk(true)} reel={REELS[active]} />
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-1" style={{ zIndex: 10 }}>
              {REELS.map((r, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Ir para: ${r.title}`} aria-current={i === active} className="w-6 h-4 flex items-center justify-end">
                  <span className="block w-1.5 rounded-full transition-all duration-300" style={{ height: i === active ? 20 : 8, background: i === active ? '#dcc8f5' : 'rgba(255,255,255,0.35)' }} />
                </button>
              ))}
            </div>

            <div className="absolute bottom-0 inset-x-0 px-5 pb-4 pt-10 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(12,6,18,0.9), transparent)', zIndex: 10 }}>
              <p className="text-white font-semibold text-sm mb-2">{REELS[active].title}</p>
              <div className="h-[3px] rounded-full overflow-hidden bg-white/15">
                <div key={`prog-${active}-${tick}`} className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #8b5cf6, #dcc8f5)', animation: paused ? 'none' : `progressBar ${INTERVAL_MS}ms linear forwards` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Sobre (statement + grupo de imagens) ────────────────────────────────────
function About({ onCTA }: { onCTA: () => void }) {
  return (
    <section id="sobre" className="relative bg-ink py-24 md:py-40 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Nossa história" title={<>Tudo começou com <strong className="text-lavender">uma trança.</strong></>} />
        <div className="mt-14 md:mt-20 grid md:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-24 items-start">
          <Reveal delay={60} className="space-y-6 leading-[1.8] text-white/65 text-[1.02rem] md:sticky md:top-32">
            <p className="text-white/90 text-[1.15rem]">Aos 15 anos, Jhenny começou a fazer tranças por incentivo da sua tia. Os primeiros trabalhos foram feitos nas próprias irmãs, dentro de casa, e foi assim que nasceu seu interesse por essa arte.</p>
            <p>O que começou de forma simples foi ganhando espaço e se tornando cada vez mais especial. Com dedicação e carinho pelo que faz, Jhenny transformou aquele primeiro contato com as tranças em uma trajetória que continua crescendo.</p>
            <p>Hoje, a Tranças da Jhenny representa esse começo: uma paixão que nasceu em família e que, com o tempo, ganhou seu próprio espaço.</p>
            <button onClick={onCTA} className="btn btn-primary mt-4">Simular minha sessão <ArrowRight /></button>
          </Reveal>
          <Reveal delay={140} className="grid grid-cols-6 gap-3 md:gap-4">
            <div className="col-span-4 aspect-[4/5] overflow-hidden bg-card"><img src={IMG.hero} alt="Jhenny, especialista em tranças" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" /></div>
            <div className="col-span-2 flex flex-col gap-3 md:gap-4 mt-10 md:mt-16">
              <div className="aspect-[3/4] overflow-hidden bg-card"><img src={p05} alt="Box Braids" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
              <div className="aspect-[3/4] overflow-hidden bg-card"><img src={p03} alt="Bantu Knots" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── Depoimentos ──────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="bg-ink py-24 md:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Depoimentos" title={<>O que dizem nossas <strong className="text-lavender">clientes</strong></>} />
        <div className="mt-14 grid md:grid-cols-3 gap-4 md:gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="h-full flex flex-col border border-white/12 bg-white/[0.03] p-8 md:p-9 hover:border-lilac/50 hover:bg-white/[0.05] transition-colors duration-500">
                <figcaption className="flex items-baseline justify-between gap-3">
                  <span className="h-display text-[1.5rem] text-white">{t.name}</span>
                </figcaption>
                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.2em] text-lilac">/ cliente jhenny · {t.city}</p>
                <div className="flex gap-0.5 text-amber-300 mt-6" role="img" aria-label={`${t.stars} de 5 estrelas`}>
                  {Array.from({ length: t.stars }).map((_, k) => <StarIcon key={k} className="w-3.5 h-3.5" />)}
                </div>
                <blockquote className="mt-5 flex-1 text-[1rem] leading-[1.75] text-white/70">&ldquo;{t.text}&rdquo;</blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ({ onCTA }: { onCTA: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-24">
        <div className="lg:sticky lg:top-28 self-start">
          <SectionHead eyebrow="Dúvidas frequentes" title={<>Tudo que você precisa <em className="text-lilac font-medium">saber</em></>} />
          <Reveal delay={100} className="mt-8">
            <p className="text-white/60 text-sm mb-4">Ainda tem dúvidas?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onCTA} className="btn btn-primary btn-sm">Agendar horário</button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</a>
            </div>
          </Reveal>
        </div>

        <div className="border-t border-white/10">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="border-b border-white/10">
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-btn-${i}`}
                    className="w-full text-left py-6 flex items-start justify-between gap-6 group"
                  >
                    <span className={`h-display text-[1.45rem] md:text-[1.7rem] leading-tight transition-colors ${isOpen ? 'text-lavender' : 'text-white group-hover:text-lavender'}`}>{item.q}</span>
                    <span aria-hidden className={`shrink-0 mt-1 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-violet border-violet text-white rotate-180' : 'border-white/20 text-white/70'}`}>
                      <ChevronDown />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className="grid transition-[grid-template-rows] duration-500 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="pb-7 pr-12 text-[0.98rem] leading-relaxed text-white/65 max-w-xl">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── CTA final ────────────────────────────────────────────────────────────────
function FinalCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <section id="agendar" className="px-4 sm:px-6 pb-6 bg-ink">
      <div className="relative overflow-hidden grain rounded-[2rem] md:rounded-[2.5rem] py-24 md:py-32" style={{ background: 'linear-gradient(135deg, #3a1580 0%, #2a0d52 45%, #1a0834 100%)' }}>
        <div aria-hidden className="absolute -top-24 -right-16 w-[30rem] h-[30rem] rounded-full blur-[90px] opacity-50" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div aria-hidden className="absolute -bottom-32 -left-20 w-[24rem] h-[24rem] rounded-full blur-[90px] opacity-30" style={{ background: 'radial-gradient(circle, #dcc8f5, transparent 70%)' }} />
        <Reveal className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="eyebrow !text-lavender justify-center">Pronta para começar?</p>
          <h2 className="h-display mt-6 text-[clamp(2.6rem,6.4vw,4.8rem)] text-white">Sua transformação<br />começa com <em className="text-lavender font-medium">um clique</em></h2>
          <p className="mt-6 mx-auto max-w-lg leading-relaxed text-lavender/75">Simule o preço do seu estilo preferido, escolha o melhor horário e garanta sua vaga com sinal via PIX em minutos.</p>
          <div className="mt-11 flex flex-col sm:flex-row gap-3.5 justify-center">
            <button onClick={onCTA} className="btn btn-light">Agendar horário <ArrowRight /></button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><WhatsAppIcon className="w-4 h-4" /> Falar no WhatsApp</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}


// Os vídeos vêm do Instagram: só carregam depois que a visitante clica (privacidade: o Instagram não recebe o acesso antes disso).
function ReelFrame({ ok, onOk, reel }: { ok: boolean; onOk: () => void; reel: { shortcode: string; title: string } }) {
  if (!ok) return (
    <div className="flex h-full min-h-[568px] w-full flex-col items-center justify-center gap-4 bg-card px-7 text-center">
      <p className="text-sm text-white/80">Este vídeo é do Instagram. Ao carregar, o Instagram (Meta) pode registrar seu acesso, conforme a política dele.</p>
      <button onClick={onOk} className="btn btn-primary btn-sm">Carregar vídeos</button>
      <a href={INSTA} target="_blank" rel="noopener noreferrer" className="text-xs text-lilac underline">Ou abrir no Instagram</a>
    </div>
  )
  return (
    <iframe title={`Reel: ${reel.title}`} src={`https://www.instagram.com/reel/${reel.shortcode}/embed/`} width="320" height="568" frameBorder="0" scrolling="no" allowFullScreen loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" className="block w-full" style={{ minHeight: 568, border: 'none' }} />
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
type View = 'landing' | 'booking' | 'calculator' | 'admin' | 'privacidade' | 'termos' | 'pagamentos' | 'meus-dados' | 'agendamento'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [mine, setMine] = useState<{ id: string; token: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const goLanding = () => { setView('landing'); setMenuOpen(false); if (window.location.hash.startsWith('#/')) history.replaceState(null, '', window.location.pathname) }
  const goCalc    = () => { setView('calculator'); setMenuOpen(false) }

  // A área administrativa não tem link no site: só abre em /#/admin (e exige login).
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash
      if (h === '#/admin' || h.startsWith('#/admin?') || h.startsWith('#/admin&') || h.includes('type=recovery')) { setView('admin'); return }
      const m = h.match(/^#\/agendamento\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i)
      if (m) { setMine({ id: m[1], token: m[2] }); setView('agendamento'); return }
      const pages: Record<string, View> = { '#/privacidade': 'privacidade', '#/termos': 'termos', '#/pagamentos': 'pagamentos', '#/meus-dados': 'meus-dados' }
      if (pages[h]) setView(pages[h])
      else setView(v => (v === 'calculator' || v === 'booking') ? v : 'landing')
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  // a área administrativa não deve aparecer em buscadores
  useEffect(() => {
    if (view !== 'admin') return
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'
    document.head.appendChild(m)
    return () => { m.remove() }
  }, [view])

  // cada tela começa no topo
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [view])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [menuOpen])

  if (view === 'privacidade') return <Privacy onBack={goLanding} />
  if (view === 'termos') return <Terms onBack={goLanding} />
  if (view === 'pagamentos') return <Payments onBack={goLanding} />
  if (view === 'meus-dados') return <MyData onBack={goLanding} />
  if (view === 'agendamento' && mine) return <MyBookingPage id={mine.id} token={mine.token} onBack={goLanding} />
  if (view === 'booking')    return <Booking onBack={goLanding} />
  if (view === 'calculator') return <BraidCalculator onBack={goLanding} />
  if (view === 'admin') {
    if (isLive) return <LiveAdmin onBack={goLanding} />
    // sem backend não há login: o painel de exemplo só aparece no ambiente de desenvolvimento
    if (import.meta.env.DEV) return <AdminDashboard onBack={goLanding} />
    return (
      <div className="min-h-screen bg-ink text-cream flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <p className="eyebrow justify-center">Área administrativa</p>
          <h1 className="h-display mt-4 text-3xl text-white">Indisponível</h1>
          <p className="mt-3 text-sm text-white/60">O acesso exige login e só funciona depois de conectar o banco de dados.</p>
          <button onClick={goLanding} className="btn btn-ghost mt-8">Voltar ao site</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans bg-ink text-cream">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-white focus:text-orchid focus:px-4 focus:py-2 focus:text-sm">Pular para o conteúdo</a>

      {/* NAV */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || menuOpen ? 'glass border-b border-white/10' : 'border-b border-transparent'}`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex items-center justify-between h-[4.5rem] md:h-20">
          <a href="#" aria-label="Tranças da Jhenny — início"><Logo /></a>

          <nav aria-label="Principal" className="hidden md:flex items-center gap-9 text-[0.82rem] font-medium tracking-wide text-white/70">
            {NAV_LINKS.map(l => <a key={l.href} href={l.href} className="relative py-1 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-lilac after:transition-transform hover:after:scale-x-100">{l.label}</a>)}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={goCalc} className="btn btn-primary btn-sm">Agendar horário</button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="menu-mobile" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center text-white">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        <div aria-hidden ref={progressRef} className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-violet to-lavender" style={{ transform: 'scaleX(0)' }} />
      </header>

      {/* menu mobile em tela cheia */}
      {menuOpen && (
        <div id="menu-mobile" className="anim-fade-in md:hidden fixed inset-0 z-[45] bg-ink/98 pt-24 px-6 pb-8 flex flex-col overflow-y-auto" style={{ background: 'radial-gradient(120% 60% at 100% 0%, #2a0d52 0%, #0c0612 60%)' }}>
          <nav aria-label="Menu" className="flex flex-col">
            {NAV_LINKS.map((l, i) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="anim-fade-up h-display text-[2.6rem] py-3 border-b border-white/10 text-white" style={{ animationDelay: `${i * 60}ms` }}>{l.label}</a>
            ))}
          </nav>
          <div className="mt-auto pt-10 flex flex-col gap-3">
            <button onClick={goCalc} className="btn btn-primary w-full">Agendar horário <ArrowRight /></button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</a>
          </div>
        </div>
      )}

      <main id="conteudo">
        <Hero onCTA={goCalc} />
        <PhotoStrip />
        <About onCTA={goCalc} />
        <Services onCTA={goCalc} />
        <HowItWorks onCTA={goCalc} />
        <Portfolio onCTA={goCalc} />
        <Experience onCTA={goCalc} />
        <Testimonials />
        <VideoCarousel />
        <FAQ onCTA={goCalc} />
        <FinalCTA onCTA={goCalc} />
      </main>

      {/* RODAPÉ */}
      <footer id="contato" className="bg-ink pt-20 pb-10 border-t border-white/8">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid md:grid-cols-[1.4fr_1fr_1.2fr] gap-12 pb-12 border-b border-white/10">
            <div>
              <Logo size="lg" />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">Arte em tranças para mulheres que valorizam beleza, qualidade e exclusividade.</p>
            </div>
            <nav aria-label="Rodapé">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/40 mb-5">Navegação</p>
              <ul className="flex flex-col gap-3.5 text-sm text-white/70">
                {NAV_LINKS.map(l => <li key={l.href}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>)}
                <li><button onClick={goCalc} className="hover:text-white transition-colors text-left">Simular preço</button></li>
              </ul>
            </nav>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/40 mb-5">Contato</p>
              <ul className="flex flex-col gap-3.5 text-sm text-white/70">
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">(11) 97507-6649</a></li>
                {!isPending(LEGAL.email) && <li><a href={`mailto:${LEGAL.email}`} className="hover:text-white transition-colors break-all">{LEGAL.email}</a></li>}
                <li>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-2.5 hover:text-white transition-colors">
                    <PinIcon className="w-4 h-4 mt-0.5 shrink-0 text-lilac" />
                    <span>{ADDRESS}<span className="block mt-1 text-xs text-lilac group-hover:underline">Ver no mapa ↗</span></span>
                  </a>
                </li>
              </ul>
              <div className="flex gap-2.5 mt-6">
                <a href={INSTA} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-lavender hover:bg-brand hover:border-brand hover:text-white transition-colors"><InstagramIcon /></a>
                <a href="#" aria-label="TikTok" className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-lavender hover:bg-brand hover:border-brand hover:text-white transition-colors"><TikTokIcon /></a>
              </div>
            </div>
          </div>
          <div aria-hidden className="overflow-hidden py-12"><p className="h-display uppercase select-none text-center text-[clamp(1.2rem,6.2vw,7rem)] leading-none tracking-[0.02em] text-transparent [-webkit-text-stroke:1px_rgba(220,200,245,0.2)] whitespace-nowrap">Tranças da Jhenny</p></div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2026 Tranças da Jhenny. Todos os direitos reservados.{!isPending(LEGAL.legalName) && <> {LEGAL.legalName}{!isPending(LEGAL.document) && <> · {LEGAL.document}</>}</>}</p>
            <nav aria-label="Informações legais" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <a href="#/privacidade" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#/termos" className="hover:text-white transition-colors">Termos de uso</a>
              <a href="#/pagamentos" className="hover:text-white transition-colors">Pagamentos e cancelamento</a>
              <a href="#/meus-dados" className="hover:text-white transition-colors">Meus dados</a>
            </nav>
          </div>
        </div>
      </footer>

      {/* espaço para a barra fixa no mobile */}
      <div className="h-24 md:hidden bg-ink" aria-hidden />

      {/* WhatsApp flutuante (desktop) */}
      <WhatsAppFloat className="hidden md:flex" />

      {/* barra fixa (mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden glass border-t border-white/10 px-4 pt-3 flex gap-2.5" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" className="btn btn-ghost !min-h-12 !px-0 w-14 shrink-0 !text-[#2fe57a] !border-[#2fe57a]/40"><WhatsAppIcon className="w-6 h-6" /></a>
        <button onClick={goCalc} className="btn btn-primary !min-h-12 flex-1">Agendar horário</button>
      </div>
    </div>
  )
}
