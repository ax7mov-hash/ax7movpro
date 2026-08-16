import Image from "next/image";
import Link from "next/link";
import type { Locale, Project } from "@/lib/content";
import { copy } from "@/lib/content";
import { INSTAGRAM, WHATSAPP_URL } from "@/lib/config";
import { ProjectGrid } from "./ProjectGrid";

export function HomePage({ locale, projects }: { locale: Locale; projects: Project[] }) {
  const t = copy[locale];
  return <main>
    <section className="home-hero">
      <div className="hero-media" aria-label="Cinematic automotive showreel placeholder"><Image src="/media/midnight-velocity.png" alt="" fill priority sizes="100vw" /><span /></div>
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">{t.heroKicker}</p>
        <h1 data-hero-title><span>{t.heroTitle.lead}</span><em>{t.heroTitle.accent}</em></h1>
        <div className="hero-foot" data-hero-copy><p>{t.heroText}</p><div className="hero-actions"><Link className="text-link light" data-magnetic href={`/${locale}/gallery`}>{t.viewWork} ↘</Link><a className="text-link light" data-magnetic href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.contactWhatsApp} ↗</a></div></div>
      </div>
      <div className="scroll-cue"><span /> Scroll</div>
    </section>

    <section className="section work-section">
      <div className="section-heading" data-reveal><p className="eyebrow">{t.featuredEyebrow}</p><h2 data-text-reveal>{t.featuredTitle}</h2><Link className="text-link" data-magnetic href={`/${locale}/gallery`}>{t.viewWork} ↗</Link></div>
      <ProjectGrid projects={projects} locale={locale} limit={6} />
    </section>

    <div className="kinetic-band" aria-hidden="true"><div><span>Photography</span><i>✦</i><span>Videography</span><i>✦</i><span>Creative direction</span><i>✦</i><span>Paris + beyond</span><i>✦</i><span>Photography</span><i>✦</i><span>Videography</span><i>✦</i><span>Creative direction</span><i>✦</i><span>Paris + beyond</span><i>✦</i></div></div>

    <section className="services-section">
      <div className="services-title" data-reveal><p className="eyebrow">{t.servicesEyebrow}</p><h2 data-text-reveal>{t.servicesTitle}</h2></div>
      <div className="services-list">{t.services.map(([index, title, description]) => <article key={title} data-reveal><span>{index}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>

    <section className="about-preview">
      <div className="about-image" data-image-reveal data-drift><Image src="/media/quiet-character.png" alt={projects[3].alt[locale]} fill sizes="(max-width: 760px) 100vw, 48vw" /></div>
      <div className="about-copy" data-reveal><p className="eyebrow">{t.aboutEyebrow}</p><h2 data-text-reveal>{t.aboutTitle}</h2><p>{t.aboutPreview}</p><Link className="text-link" data-magnetic href={`/${locale}/about`}>{t.readStory} ↗</Link></div>
    </section>

    <section className="instagram-section">
      <div className="instagram-heading" data-reveal><div><p className="eyebrow">Instagram · @ax7.mov</p><h2 data-text-reveal>{t.instagramTitle}</h2></div><div><p>{t.instagramText}</p><a className="text-link" data-magnetic href={INSTAGRAM} target="_blank" rel="noopener noreferrer">{t.visitInstagram} ↗</a></div></div>
      <div className="instagram-grid" aria-label={t.instagramPlaceholder}><div data-image-reveal data-drift><Image src="/media/atelier-no-7.png" alt="" fill sizes="33vw" /></div><div data-image-reveal><Image src="/media/midnight-velocity.png" alt="" fill sizes="33vw" /></div><div data-image-reveal data-drift><Image src="/media/a-day-to-remember.png" alt="" fill sizes="33vw" /></div></div>
    </section>

    <section className="closing-cta"><p className="eyebrow">Paris · France · Available to travel</p><h2 data-text-reveal>{t.closing}<br /><em>{t.closingSub}</em></h2><a data-magnetic href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.contactWhatsApp} <span>↗</span></a></section>
  </main>;
}
