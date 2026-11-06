import React, { useEffect } from 'react';
import { getPolicyPageSections, OTHER_POLICY_LINKS } from '../data/policyPages';

function SectionBody({ section }) {
  return (
    <div className="mt-3 space-y-3 text-sm text-slate-600 leading-relaxed">
      {(section.paragraphs || []).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {(section.lists || []).map((items) => (
        <ul key={items[0]} className="list-disc pl-5 space-y-1.5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export default function PolicyPage({ page, onNavigatePath }) {
  const sections = getPolicyPageSections(page);
  const relatedPages = OTHER_POLICY_LINKS(page.slug);

  useEffect(() => {
    document.title = `${page.title} | TRUMITRIP`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page.slug, page.title]);

  const scrollToSection = (sectionId) => {
    window.history.replaceState(null, '', `/${page.slug}/#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="flex-grow w-full bg-slate-100 min-h-0">
      <section className="bg-[#0A192F] text-white w-full">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14">
          <nav className="mb-4 text-xs text-slate-400">
            <button type="button" onClick={() => onNavigatePath && onNavigatePath('/')} className="hover:text-[#D4AF37]">
              Home
            </button>
            <span className="mx-2">/</span>
            <span className="text-slate-200">{page.title}</span>
          </nav>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">TrumiTrip</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">{page.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 leading-relaxed">{page.subtitle}</p>
        </div>
      </section>

      <div
        className={`w-full px-4 sm:px-6 md:px-10 lg:px-14 py-8 ${
          page.showSectionNav
            ? 'grid grid-cols-1 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] gap-6 xl:gap-10 items-start'
            : ''
        }`}
      >
        {page.showSectionNav && (
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <nav className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">On this page</p>
              <ul className="max-h-[65vh] xl:max-h-[calc(100vh-8rem)] overflow-y-auto space-y-1 pr-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left block text-xs font-semibold text-slate-600 hover:text-[#0A192F] hover:bg-amber-50 rounded-lg px-2 py-1.5"
                    >
                      {section.nav}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <article className="w-full min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-8 lg:p-10 space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                {section.title}
              </h2>
              <SectionBody section={section} />
            </section>
          ))}

          <nav className="border-t border-slate-100 pt-6">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              {relatedPages.map((related) => (
                <button
                  key={related.slug}
                  type="button"
                  onClick={() => onNavigatePath && onNavigatePath(`/${related.slug}/`)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#D4AF37] hover:text-slate-950"
                >
                  {related.title}
                </button>
              ))}
            </div>
          </nav>
        </article>
      </div>
    </main>
  );
}
