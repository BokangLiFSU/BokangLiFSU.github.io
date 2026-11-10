import {readFile, writeFile, mkdir, copyFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await readFile(path.join(root, 'content', file), 'utf8'));
const d = await read('site.json');
const styleVersion = createHash('sha256').update(await readFile(path.join(root,'assets/reference.css'))).digest('hex').slice(0,10);
const diagramVersion = createHash('sha256').update(await readFile(path.join(root,'assets/research-optimization.svg'))).digest('hex').slice(0,10);
const papers = await read('publications.json');
const chapters = await read('chapters.json');
const stories = await read('research-stories.json');
const storyFor = doi => stories.cases.find(c=>c.doi.toLowerCase()===doi.toLowerCase());
const paragraphs = list => list.map(text=>`<p>${esc(text)}</p>`).join('');
const out = path.join(root, 'dist');
await mkdir(path.join(out, 'assets'), {recursive:true});
// Publish only reviewed website assets, including the author’s LinkedIn photos.
for (const file of ['reference.css', 'research-optimization.svg', 'research-warehouse.jpg', 'research-flood-observation.jpg', 'paper-berth-layout.png', 'paper-crossdock-layout.jpg', 'paper-adaptive-search.png', 'research-port-aerial.jpg', 'research-container-yard.jpg', 'research-manufacturing.jpg', 'research-relief-logistics.jpg', 'research-distribution.jpg', 'research-crossdock-handling.jpg', 'site.js', 'favicon.svg', 'portrait-approved-a-clear.jpg', 'trb-front-2024.jpg', 'trb-presenters-2026.jpg', 'trb-discussion-2024.jpg', 'trb-talk-2024.jpg', 'defense-colleagues-2025.jpg', 'informs-colleagues-2025.jpg']) {
  await copyFile(path.join(root, 'assets', file), path.join(out, 'assets', file));
}
for (const file of ['bokang-linkedin.jpg','defense-2025.jpg','informs-2025.jpg','headshot.png', 'portrait.jpg', 'social.svg', 'style.css', 'academic.css', 'algorithms.svg', 'maritime.svg', 'resilience.svg']) {
  await rm(path.join(out, 'assets', file), {force:true});
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, label, attrs='') => `<a href="${esc(url)}"${attrs ? ' '+attrs : ''}>${label}</a>`;
const nav = [['index.html','Home'],['research.html','Research'],['publications.html','Publications'],['projects.html','Projects'],['teaching.html','Teaching & Service'],['about.html','CV'],['activities.html','Activities'],['contact.html','Contact']];
const social = () => [link('mailto:'+d.email,'Email'),link('about.html','CV'),link(d.scholar,'Google Scholar'),link(d.orcid,'ORCID'),link(d.linkedin,'LinkedIn'),link(d.github,'GitHub')].join(' ');
const sectionHeading = (title, more='') => `<div class="section-heading"><h2>${title}</h2>${more}</div>`;

function page(title, content, file) {
  const home = file === 'index.html';
  const fullTitle = home ? 'Bokang Li, Ph.D. | Academic Website' : `${title} | Bokang Li`;
  const navPage = file.startsWith('research-') || file.startsWith('work-') ? 'research.html' : file;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ffffff"><title>${esc(fullTitle)}</title><meta name="description" content="${esc(d.description)}"><link rel="canonical" href="${d.origin}/${home ? '' : file}"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(d.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${d.origin}/${home ? '' : file}"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/reference.css?v=${styleVersion}"><script src="assets/site.js" defer></script><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:d.name,url:d.origin,sameAs:[d.scholar,d.orcid,d.linkedin,d.github]}).replace(/</g,'\\u003c')}</script></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="site-name" href="index.html" translate="no">Bokang Li, Ph.D.</a><nav id="main-nav" aria-label="Main navigation">${nav.map(([url,label]) => link(url,label,file===url?'aria-current="page"':navPage===url?'aria-current="location"':'')).join('')}</nav></div></header>
<main id="main">${content}</main><footer><span>© 2026 Bokang Li</span><span>${link('credits.html','About this website')}<span aria-hidden="true"> · </span>Updated November 2026</span></footer></body></html>`;
}

function publication(p, {searchable=false, selected=false, compact=false}={}) {
  const doi = 'https://doi.org/'+p.doi;
  const study = storyFor(p.doi);
  const contribution = study?.summary ?? p.contribution;
  const authorList = p.authors.map(name=>/\bBokang Li\b/.test(name) ? `<strong>${esc(name)}</strong>` : esc(name)).join(', ');
  const issue = p.issue ? `(${esc(p.issue)})` : '';
  const volume = p.volume ? `, ${esc(p.volume)}${issue}` : '';
  const pages = p.pages ? `, ${esc(p.pages)}` : '';
  const citation = `<h3>${link(doi,esc(p.title))}</h3><p class="authors">${authorList}</p><p class="venue"><em>${esc(p.journal)}</em>${volume}${pages}, ${p.year}.</p>`;
  if (compact) return `<article class="paper compact-paper">${citation}</article>`;
  const thumbnail = selected ? study?.figure : null;
  return `<article class="paper${selected?' selected-paper':''}"${searchable?` data-paper data-year="${p.year}" data-search="${esc([p.title,p.journal,...p.authors].join(' ').toLowerCase())}"`:''}>${thumbnail?`<a class="paper-thumb" href="${esc(doi)}" aria-label="Open ${esc(p.title)}"><img src="assets/${esc(thumbnail.file)}" alt="${esc(thumbnail.caption)}" width="${thumbnail.width}" height="${thumbnail.height}" loading="lazy"></a><div class="paper-copy">`:''}${citation}<div class="paper-resources">${link(doi,'Publisher',`aria-label="Publisher page for ${esc(p.title)}"`)}<span aria-hidden="true"> / </span><details><summary>BibTeX<span class="sr-only"> for ${esc(p.title)}</span></summary><pre>${esc(p.bibtex)}</pre><button class="copy-citation" type="button">Copy BibTeX</button><span class="copy-status" role="status" aria-live="polite"></span></details></div>${(selected || searchable) && contribution ? `<p class="paper-explanation">${esc(contribution)}${study ? ' ' + link('work-'+study.id+'.html','Methods and findings') : ''}</p>` : ''}${thumbnail?'</div>':''}</article>`;
}

const researchOverview = () => paragraphs(stories.overview);
const researchTopics = () => `<ul class="research-topics">${d.topics.map(t=>`<li>${link('research-'+t.id+'.html',esc(t.title))}<span>${esc(t.description)}</span></li>`).join('')}</ul>`;
const awards = () => `<ul class="dated-list">${d.awards.map(x=>`<li><span class="date">${esc(x.year)}</span><span><strong>${esc(x.title)}</strong><br>${esc(x.issuer)}.</span></li>`).join('')}</ul>`;

function biographyParagraphs() {
  return d.biography.map(paragraph => {
    let text = esc(paragraph).replace(/\b(?:15|20)\+/g, count => '<strong>' + count + '</strong>');
    for (const journal of d.biographyJournals ?? []) {
      const name = esc(journal);
      text = text.replaceAll(name, '<em>' + name + '</em>');
    }
    return '<p>' + text + '</p>';
  }).join('');
}

function home() {
  const featured = papers.filter(p => p.featured);
  const illustrated = featured.filter(p => storyFor(p.doi)?.figure);
  const additional = featured.filter(p => !illustrated.includes(p));
  return `<section id="about" class="about"><h1>Biography</h1><div class="profile-intro${d.portrait?' has-portrait':''}">${d.portrait?`<figure class="profile-portrait"><a class="approved-avatar" href="assets/${esc(d.portrait.file)}" aria-label="View full portrait photograph"><img src="assets/${esc(d.portrait.file)}" alt="${esc(d.portrait.alt)}" width="${d.portrait.width}" height="${d.portrait.height}" fetchpriority="high"></a><figcaption>${esc(d.portrait.caption)}</figcaption></figure>`:''}<div class="profile-copy">${biographyParagraphs()}<p class="profile-links">${social()}</p></div></div></section>
<section id="research">${sectionHeading('Research Interests',link('research.html','Research overview'))}${researchTopics()}</section>
<section id="publications">${sectionHeading('Selected Publications',link('publications.html','All publications'))}${illustrated.map(p=>publication(p,{selected:true})).join('')}<div class="additional-papers">${additional.map(p=>publication(p,{compact:true})).join('')}</div></section>
<section id="projects">${sectionHeading('Research Projects',link('projects.html','All projects'))}<ul class="home-projects"><li>${link('projects.html#sponsored','Sponsored Projects')}<span>Humanitarian relief planning for the U.S. Air Force and highway–rail crossing decisions for the Florida Department of Transportation.</span></li><li>${link('projects.html#current-work','Ongoing Research')}<span>Integrated scheduling for automated equipment and reusable resources, liner service recovery, and the effects of upstream schedules on service capacity.</span></li></ul></section>
<section id="news">${sectionHeading('Recent Updates',link('activities.html','All activities'))}<ul class="dated-list news-list"><li><time class="date" datetime="2026-10">Oct 2026</time><span>Our cross-docking study on ${link('https://doi.org/10.1016/j.tre.2026.105264','sequential fix-and-optimize and pricing-guided search')} appeared in <em>Transportation Research Part E</em>.</span></li><li><time class="date" datetime="2026-10">Oct 2026</time><span>Our ${link('https://doi.org/10.1016/j.cstp.2026.102006','shore-power implementation study')} appeared in <em>Case Studies on Transport Policy</em>.</span></li><li><time class="date" datetime="2026-08-26">Aug 2026</time><span>Our berth-scheduling research was covered in ${link('https://eng.famu.fsu.edu/news/new-model-speeds-ship-scheduling-worlds-busiest-ports','“New Model Speeds Up Ship Scheduling at the World’s Busiest Ports”')}.</span></li></ul></section>
<section class="academic-links" aria-label="Teaching, activities and service">
  <p id="activities">${link('activities.html','Academic activities')}<span>Conference photographs, presentations and research coverage</span></p>
  <p id="teaching">${link('teaching.html','Teaching and mentorship')}<span>Graduate courses and research supervision</span></p>
  <p id="awards">${link('about.html#awards','Awards and honors')}<span>Future Faculty and Graduate Research Excellence awards</span></p>
  <p id="service">${link('teaching.html#reviewing','Journal reviewing')}<span>Reviewing in optimization, AI, logistics and transportation</span></p>
</section>`;
}

function publications() {
  const years = [...new Set(papers.map(p=>p.year))].sort((a,b)=>b-a);
  return `<h1>Publications</h1><p>${link(d.scholar,'Google Scholar')}<span aria-hidden="true"> / </span>${link(d.orcid,'ORCID')}<span aria-hidden="true"> / </span>${link('assets/publications.bib','Download BibTeX')}</p><p>Browse journal articles by title, author, journal, or year. Book chapters, the technical report, and the doctoral dissertation follow.</p><nav class="page-index" aria-label="Publication types"><a href="#journal-articles">Journal articles</a><a href="#book-chapters">Book chapters</a><a href="#technical-report">Technical report</a><a href="#dissertation">Dissertation</a></nav><h2 id="journal-articles" class="page-section-title">Journal Articles</h2><form class="publication-controls" role="search" onsubmit="return false"><label for="publication-search">Search journal articles<input name="q" id="publication-search" type="search" autocomplete="off" spellcheck="false" placeholder="Title, author or journal…"></label><label for="publication-year">Year<select name="year" id="publication-year"><option value="all">All years</option>${years.map(y=>`<option value="${y}">${y}</option>`).join('')}</select></label><button id="clear-filters" type="button">Reset</button><span id="publication-count" role="status" aria-live="polite">${papers.length} publications</span></form><div id="publication-list">${years.map(y=>`<section class="publication-year" data-year-group><h3 class="year-heading">${y}</h3>${papers.filter(p=>p.year===y).map(p=>publication(p,{searchable:true})).join('')}</section>`).join('')}</div><p id="no-results" hidden>No journal articles match your search. Try another term or reset the filters.</p><section class="publication-category" id="book-chapters"><h2 class="page-section-title">Book Chapters</h2>${chapters.map(p=>publication(p)).join('')}</section><section class="publication-category" id="technical-report"><h2 class="page-section-title">Technical Report</h2><article class="paper"><h3>${link('https://doi.org/10.13140/RG.2.2.26835.80167','Selection of Level Crossings for Closure in the State of Florida: An Optimization-based Approach')}</h3><p>Dulebenets, M. A., Moses, R., Sobanjo, J., Ozguven, E. E., Elmi, Z., &amp; <strong>Li, B.</strong></p><p><em>Florida Department of Transportation</em>, Report BED30-977-04, 2024.</p></article></section><section class="publication-category" id="dissertation"><h2 class="page-section-title">Doctoral Dissertation</h2><p><em>Effective Hyperheuristic Algorithms for the Berth Scheduling Problem at Marine Container Terminals.</em><br>Florida State University, August 2025.</p><p>${link('https://eng.famu.fsu.edu/event/dissertation-defense-bokang-li','University defense announcement and dissertation abstract')} / ${link('https://www.researchgate.net/publication/394311467_Effective_Hyperheuristic_Algorithms_for_the_Berth_Scheduling_Problem_at_Marine_Container_Terminals','Dissertation full text')}</p></section>`;
}

function storyLinks(ids){return '<ul class="story-links">'+ids.map(id=>{const c=stories.cases.find(c=>c.id===id);return `<li><strong>${link('https://doi.org/'+c.doi,esc(papers.find(p=>p.doi===c.doi)?.title??c.title))}</strong><br>${esc(c.summary)} ${link('work-'+id+'.html','Study overview')}</li>`}).join('')+'</ul>';}

function researchFigure(id, compact=false){const v=d.researchVisuals[id];return `<figure class="research-figure${compact?' compact':''}"><a href="assets/${esc(v.file)}"><img src="assets/${esc(v.file)}" alt="${esc(v.alt)}" width="${v.width}" height="${v.height}" loading="lazy"></a><figcaption>${esc(v.caption)}${v.source?` <span class="image-attribution">${link(v.source,esc(v.author))}${v.licenseUrl?` · ${link(v.licenseUrl,esc(v.license))}`:''}</span>`:` <span class="image-attribution">${esc(v.license)}</span>`}</figcaption></figure>`;}

function contributionRows(){return `<dl class="contribution-list">${stories.contributions.map(x=>{const c=stories.cases.find(c=>c.id===x.case);const p=papers.find(p=>p.doi===c.doi);return `<div><dt>${esc(x.title)}</dt><dd><p>${esc(c.summary)}</p>${link('https://doi.org/'+p.doi,esc(p.title))}</dd></div>`}).join('')}</dl>`;}
function topicFigure(id){return researchFigure(id==='algorithms'?'warehouse':id==='maritime'?'containerYard':id,true);}
function contextPair(ids){return `<div class="context-pair">${ids.map(id=>researchFigure(id,true)).join('')}</div>`;}
function decisionDiagram(){return `<figure class="decision-diagram research-figure"><a href="assets/research-optimization.svg?v=${diagramVersion}"><img src="assets/research-optimization.svg?v=${diagramVersion}" width="960" height="460" alt="Illustrative scheduling example: dependencies A to C to D and B to D, with the four tasks assigned to three resources without overlap" loading="lazy"></a><figcaption>Assignments, precedence and shared capacity link the decisions in a schedule. This illustrative example is not an experimental result.</figcaption></figure>`;}
function questionRows(items){return `<div class="research-notes">${items.map(x=>`<details><summary>${esc(x.question)}</summary><p>${esc(x.text)}</p></details>`).join('')}</div>`;}
function studyFigure(c){return c.contextVisual?researchFigure(c.contextVisual,true):'';}

function research(){
 return `<h1>Research</h1><div class="research-introduction">${researchOverview()}</div><nav class="page-index" aria-label="Research page sections"><a href="#areas">Research areas</a><a href="#contributions">Published contributions</a><a href="#agenda">Future directions</a></nav><section id="areas"><h2 class="page-section-title">Research Areas</h2><div class="research-area-list">${d.topics.map(x=>`<article><div><h3>${link('research-'+x.id+'.html',esc(x.title))}</h3><p>${esc(x.description)}</p></div>${researchFigure(x.id,true)}</article>`).join('')}</div></section><section id="contributions"><h2 class="page-section-title">Published Methodological Contributions</h2>${contributionRows()}</section><section id="agenda"><h2 class="page-section-title">Future Research Directions</h2><div class="agenda-questions">${stories.agenda.map(a=>`<details><summary><span>${esc(a.title)}</span><strong>${esc(a.question)}</strong></summary><p>${esc(a.text)}</p></details>`).join('')}</div></section><p class="page-related">${link('projects.html','Related projects')} / ${link('publications.html','All publications')}</p>`;
}

function topicPage(topic){const theme=stories.themes[topic.id];const selected=new Set(theme.cases.map(id=>stories.cases.find(c=>c.id===id).doi.toLowerCase()));const related=papers.filter(p=>p.topic===topic.id&&!selected.has(p.doi.toLowerCase()));return `<h1>${esc(topic.title)}</h1><div class="topic-opening"><div><p class="topic-lead">${esc(theme.lead)}</p></div>${topicFigure(topic.id)}</div><section><h2 class="page-section-title">Selected Studies</h2><div class="study-list">${theme.cases.map(id=>{const c=stories.cases.find(c=>c.id===id);const p=papers.find(p=>p.doi===c.doi);return `<article><h3>${link('https://doi.org/'+c.doi,esc(p.title))}</h3><p class="secondary">${esc(p.journal)}, ${p.year}</p><p>${esc(c.summary)}</p><p>${link('work-'+c.id+'.html','Methods and findings')}</p></article>`}).join('')}</div></section><section><h2 class="page-section-title">Research Directions</h2><dl class="focus-list">${theme.focus.map(x=>`<div><dt>${esc(x.title)}</dt><dd>${esc(x.text)}</dd></div>`).join('')}</dl>${questionRows(theme.futureNotes)}</section>${topic.id==='algorithms'? `<details class="reading-detail supporting-visual"><summary>Illustrated scheduling example</summary>${decisionDiagram()}</details>`:''}${related.length?`<section><h2 class="page-section-title">Further Publications</h2><ul class="compact-publications">${related.map(p=>`<li>${link('https://doi.org/'+p.doi,esc(p.title))}<span>${esc(p.journal)}, ${p.year}</span></li>`).join('')}</ul></section>`:''}<p class="page-related">${link('research.html','Research overview')} / ${link('publications.html','All publications')}</p>`;}


function storyPage(c){const p=papers.find(p=>p.doi.toLowerCase()===c.doi.toLowerCase());return `<h1>${esc(c.title)}</h1><p class="study-question">${esc(c.question)}</p><p class="study-source">${link('https://doi.org/'+p.doi,esc(p.title))}<br><span class="secondary">${esc(p.journal)}, ${p.year}</span></p><div class="study-overview${c.contextVisual?' has-figure':''}"><div><section><h2 class="page-section-title">Method</h2><p>${esc(c.approach)}</p></section><section><h2 class="page-section-title">Evidence</h2><p>${esc(c.evidence)}</p></section></div>${studyFigure(c)}</div><section class="study-contribution"><h2 class="page-section-title">Contribution</h2><p>${esc(c.meaning)}</p></section><section><h2 class="page-section-title">Further Research</h2><p>${esc(c.connection)}</p><p class="research-question">${esc(c.futureQuestion)}</p></section><details class="citation-detail"><summary>Publication and citation</summary>${publication(p)}${c.source!==('https://doi.org/'+c.doi)?`<p>${link(c.source,'Abstract and study record')}</p>`:''}</details><p class="page-related">${link('research.html','Research overview')} / ${link('publications.html','All publications')}</p>`;}


function teaching(){return `<h1>Teaching & Service</h1><p class="page-lead">In optimization and analytics courses, I want students to explain what a model represents, test how its assumptions affect the solution, and defend a recommendation in the context of the original decision.</p><nav class="page-index" aria-label="Teaching and service sections"><a href="#courses">Courses</a><a href="#mentorship">Mentorship</a><a href="#reviewing">Journal reviewing</a></nav><section id="courses"><h2 class="page-section-title">Teaching Experience</h2>${d.teaching.map(x=>`<article class="course-record"><header><h3>${esc(x.course.replace(' · ',': '))}</h3><p>${esc(x.role)}</p><p class="secondary">${esc(x.institution)}<br>${esc(x.level.replace(' · ', ', '))}</p></header><p>${esc(x.detail)}</p></article>`).join('')}</section><section><h2 class="page-section-title">Teaching Approach</h2><dl class="teaching-principles">${stories.teaching.principles.map(p=>`<div><dt>${esc(p.title)}</dt><dd>${esc(p.text)}</dd></div>`).join('')}</dl><details class="reading-detail"><summary>Analytics, AI and independent judgment</summary><p>${esc(stories.teaching.approach[2])}</p><p>${esc(stories.teaching.approach[3])}</p></details></section><section id="mentorship"><h2 class="page-section-title">Research Mentorship</h2><div class="mentoring-layout"><figure><a href="assets/informs-colleagues-2025.jpg"><img src="assets/informs-colleagues-2025.jpg" width="1280" height="960" alt="Bokang Li in conversation with a colleague at INFORMS 2025" loading="lazy"></a><figcaption>With a colleague at the INFORMS Annual Meeting, 2025.</figcaption></figure><div><p>${esc(stories.teaching.mentoring)}</p><p class="secondary">My teaching interests span optimization, analytics, production and service scheduling, logistics and supply chain management.</p></div></div></section><section><h2 class="page-section-title">Academic Community</h2><ul>${stories.teaching.community.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${link('activities.html','Presentations, conferences and photographs')}</p></section><section id="reviewing"><h2 class="page-section-title">Journal Reviewing</h2><p>Reviewer for journals in optimization, AI, operations, logistics and transportation:</p><ul class="service-list">${d.service.map(j=>`<li>${esc(j)}</li>`).join('')}</ul></section>`;}


function cv() {
  const appointments = d.background.map(b => `<div><dt>${esc(b.period)}</dt><dd><strong>${esc(b.role)}</strong><br>${esc(b.institution)}</dd></div>`).join('');
  const education = d.education.map(e => `<div><dt>${esc(e.period)}</dt><dd><strong>${esc(e.degree)}</strong><br>${esc(e.institution)}${e.detail ? `<p>${esc(e.detail)}</p>` : ''}</dd></div>`).join('');
  return `<h1>Curriculum Vitae</h1>
  <nav class="page-index" aria-label="Curriculum vitae sections"><a href="#appointments">Appointments</a><a href="#education">Education</a><a href="#awards">Awards</a>${link('publications.html','Publications')}</nav>
  <div class="cv-layout">
    <div>
      <section aria-labelledby="appointments"><h2 id="appointments" class="page-section-title">Academic Appointments</h2><dl class="records">${appointments}</dl></section>
      <section aria-labelledby="education"><h2 id="education" class="page-section-title">Education</h2><dl class="records">${education}</dl></section>
    </div>
    <aside class="cv-aside" aria-label="Dissertation defense and academic links">
      <figure class="cv-photo"><a href="assets/defense-colleagues-2025.jpg"><img src="assets/defense-colleagues-2025.jpg" width="1280" height="720" alt="Bokang Li with colleagues after his doctoral defense at Florida State University" loading="lazy"></a><figcaption>With colleagues after my doctoral defense, May 2025. ${link('https://eng.famu.fsu.edu/event/dissertation-defense-bokang-li','Defense announcement')}</figcaption></figure>
      <p class="cv-links">${link('mailto:'+d.email,'Email')} ${link(d.scholar,'Google Scholar')} ${link(d.orcid,'ORCID')}</p>
    </aside>
  </div>
  <section id="awards"><h2 class="page-section-title">Awards &amp; Honors</h2>${awards()}</section>
  <section><h2 class="page-section-title">Methods &amp; Technical Skills</h2>
    <dl class="records"><div><dt>Optimization</dt><dd>Mixed-integer programming, decomposition, exact and heuristic algorithms, and multi-objective optimization.</dd></div><div><dt>Data and AI</dt><dd>Statistical analysis, machine learning, reinforcement learning, computer vision and geospatial analysis.</dd></div><div><dt>Software</dt><dd>Python, MATLAB, R, SQL, Gurobi, CPLEX, GAMS and ArcGIS.</dd></div><div><dt>Languages</dt><dd>Mandarin Chinese and English.</dd></div></dl>
  </section>
  <p class="page-related">${link('publications.html','Publications')} / ${link('research.html','Research')} / ${link('teaching.html','Teaching and service')} / ${link('mailto:'+d.email+'?subject=CV%20request','Request full CV')}</p>`;
}

function contact() {
  return `<h1>Contact</h1><p>I welcome inquiries about research collaboration in operations research, optimization and AI, particularly on planning, scheduling and resource allocation across logistics, industrial and service systems.</p><p>${link('research.html','Research interests')} / ${link('projects.html','Research projects')}</p><dl class="contact-list"><div><dt>Email</dt><dd>${link('mailto:'+d.email,esc(d.email))}</dd></div><div><dt>University email</dt><dd>${link('mailto:'+d.workEmail,esc(d.workEmail))}</dd></div></dl><h2 class="page-section-title">Academic Profiles</h2><ul>${[[d.scholar,'Google Scholar'],[d.orcid,'ORCID'],[d.linkedin,'LinkedIn'],[d.github,'GitHub']].map(([url,label])=>`<li>${link(url,label)}</li>`).join('')}</ul>`;
}

function projectNote(work, source = '') {
  return `<article class="current-work"><h3>${esc(work.title)}</h3><p class="secondary">${esc(work.status)}</p><p>${esc(work.text)}</p>${source ? `<p>${source}</p>` : ''}</article>`;
}

function projects() {
  const published = stories.currentWork.filter(w => w.status.startsWith('Published'));
  const proposals = stories.currentWork.filter(w => w.status.startsWith('Research proposals'));
  const ongoing = stories.currentWork.filter(w => !published.includes(w) && !proposals.includes(w));
  const shorePower = papers.find(p => p.doi === '10.1016/j.cstp.2026.102006');
  return `<h1>Projects</h1>
<nav class="page-index" aria-label="Project page sections"><a href="#sponsored">Sponsored projects</a><a href="#published-projects">Published study</a><a href="#current-work">Ongoing research</a><a href="#proposals">Proposal development</a></nav>
<section id="sponsored"><h2 class="page-section-title">Sponsored Projects</h2>${d.projects.map(p=>`<article class="project-record"><header><h3>${esc(p.title)}</h3><p class="secondary">${esc(p.sponsor)}<br>${esc(p.period)}</p></header><div><p><strong>${esc(p.role)}</strong></p><p>${esc(p.context || p.detail)}</p><p>${p.url.includes('sbir.gov') ? link(p.url,'Federal award and project abstract') : link(p.url,'Final technical report') + ' / ' + link('https://rip.trb.org/View/1984660','Sponsor project record') + ' / ' + link('https://doi.org/10.1016/j.ress.2024.110197','Journal article')}</p></div></article>`).join('')}</section>
<section id="published-projects"><h2 class="page-section-title">Published Study</h2>${published.map(work=>projectNote(work,work.title === 'Infrastructure investment and realized use' ? link('https://doi.org/'+shorePower.doi,esc(shorePower.title)) : '')).join('')}</section>
<section id="current-work"><h2 class="page-section-title">Ongoing Research and Prototypes</h2>${ongoing.map(work=>projectNote(work)).join('')}</section>
<section id="proposals"><h2 class="page-section-title">Proposal Development</h2>${proposals.map(work=>projectNote(work)).join('')}</section>`;
}

function activities(){return `<h1>Activities</h1><p>Conference presentations and posters, photographs from academic meetings, and coverage of my research.</p><h2 class="page-section-title">Conference participation</h2><div class="activity-gallery">${d.activities.map(a=>`<figure><div class="event-photographs"><a href="assets/${esc(a.file)}"><img src="assets/${esc(a.file)}" alt="${esc(a.alt)}" width="${a.width}" height="${a.height}" loading="lazy"></a>${a.photos?.length?`<details class="event-album"><summary>More photographs (${a.photos.length})</summary>${a.photos.map(photo=>`<div class="event-photo"><a href="assets/${esc(photo.file)}"><img src="assets/${esc(photo.file)}" alt="${esc(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy"></a><p class="secondary">${esc(photo.caption)}</p></div>`).join('')}</details>`:''}</div><figcaption><h3>${esc(a.title)}</h3><p class="secondary">${esc(a.date)}</p><p>${esc(a.caption)}</p>${link(a.url,esc(a.label))}</figcaption></figure>`).join('')}</div><h2 class="page-section-title">Research in the news</h2>${d.media.map(m=>`<article class="media-entry"><h3>${link(m.url,esc(m.title))}</h3><p class="secondary">${esc(m.outlet)}</p><p>${esc(m.text)}</p></article>`).join('')}<h2 class="page-section-title">Selected conference contributions</h2><ul class="talk-list">${d.talks.map(t=>`<li><strong>${esc(t.title)}</strong><br>${esc(t.event.replaceAll(' · ', ', '))}, ${t.year}.</li>`).join('')}</ul><p>More updates on ${link(d.linkedin,'LinkedIn')}.</p>`;}

const credits = `<h1>About This Website</h1><section><h2 class="page-section-title">Professional Information</h2><p>Professional information follows the author’s curriculum vitae and institutional sources. Publication titles, author order, venues and DOIs were checked against publisher metadata through Crossref; project descriptions distinguish published studies, research syntheses and work in progress. The ${link(d.scholar,'Google Scholar')} and ${link(d.orcid,'ORCID')} profiles provide additional research records.</p></section><section><h2 class="page-section-title">Research Images</h2><p>The three selected-publication thumbnails reproduce figures from my coauthored papers and link to those articles. Photographs on research and project pages illustrate the operating settings; they do not depict study sites or imply a research partnership. The scheduling diagram is an original conceptual illustration, not a computed research result. Photographs retain their full framing; web-sized copies are used for loading performance.</p><ul>${Object.values(d.researchVisuals).filter(v=>v.source).map(v=>`<li>${link(v.source,esc(v.alt))} — ${esc(v.author)}${v.licenseUrl?`; ${link(v.licenseUrl,esc(v.license))}`:''}.</li>`).join('')}</ul><h2 class="page-section-title">Photographs</h2><p>The conference and dissertation-defense photographs were selected from the author’s public LinkedIn activities with the author’s authorization. Images retain their original appearance.</p></section><section><h2 class="page-section-title">Privacy</h2><p>This website has no analytics, advertising or contact form. External services and the hosting provider have their own privacy policies.</p></section>`;
const pages = [['index.html','Home',home()],['publications.html','Publications',publications()],['research.html','Research',research()],['teaching.html','Teaching & Service',teaching()],['about.html','Curriculum Vitae',cv()],['contact.html','Contact',contact()],['credits.html','About This Website',credits],['activities.html','Academic Activities',activities()],['projects.html','Projects',projects()],...d.topics.map(t=>['research-'+t.id+'.html',t.title,topicPage(t)]),...stories.cases.map(c=>['work-'+c.id+'.html',c.title,storyPage(c)])];
for (const [file,title,body] of pages) await writeFile(path.join(out,file),page(title,body,file));
await writeFile(path.join(out,'404.html'),page('Page Not Found','<h1>Page Not Found</h1><p>The requested page could not be found. '+link('index.html','Return to the homepage')+'.</p>','404.html'));
await writeFile(path.join(out,'assets/publications.bib'),[...papers,...chapters].map(p=>p.bibtex).join('\n\n')+'\n');
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${d.origin}/sitemap.xml\n`);
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(([u])=>`<url><loc>${d.origin}/${u==='index.html'?'':u}</loc></url>`).join('')}</urlset>`);
console.log(`Built reference-led academic website: ${pages.length+1} pages, ${papers.length} journal articles, ${chapters.length} book chapters; reviewed LinkedIn photographs.`);
