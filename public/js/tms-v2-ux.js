(()=>{
  const qs=s=>document.querySelector(s);
  const addGuide=(screen,title,why,doNow,get,endOutcome='')=>{
    const root=qs(`[data-screen="${screen}"] .card`); if(!root)return;
    const first=root.querySelector('.summary')||root.querySelector('.lead')||root.querySelector('h2');
    const box=document.createElement('div'); box.className='journey-guide';
    box.innerHTML=`<div class="journey-guide__item"><span>WHAT YOU'RE DOING</span><b>${title}</b></div><div class="journey-guide__item"><span>WHY IT MATTERS</span><p>${why}</p></div><div class="journey-guide__item"><span>WHAT TO DO NOW</span><p>${doNow}</p></div><div class="journey-guide__item journey-guide__output"><span>WHAT YOU'LL GET NEXT</span><b>${get}</b></div>${endOutcome?`<div class="journey-guide__item journey-guide__end"><span>BY THE END OF THE CHALLENGE</span><p>${endOutcome}</p></div>`:''}`;
    if(first) first.insertAdjacentElement('afterend',box); else root.prepend(box);
  };

  addGuide(2,
    'Give us the role you are trying to hire.',
    'Many searches become difficult before sourcing even starts because the requirement is unclear, too broad, or mixes too many expectations. We will use what you enter here to identify those issues before you spend time searching the market.',
    'Add only what you genuinely know from the JD or hiring-manager discussion. If something is unclear, say Unknown instead of guessing.',
    'A Hiring Requirement Diagnostic showing what is clear, what may be restricting the search, what is missing, and what you should clarify with the hiring manager before sourcing.',
    '<b>1. Hiring Requirement Diagnostic</b><br><b>2. Talent Market Snapshot</b><br><b>3. Hiring Manager Advisory Recommendation</b>'
  );
  addGuide(3,'Check whether this role is actually ready for sourcing.','This step surfaces unclear requirements, hidden assumptions and constraints that can waste sourcing time or create misalignment with the hiring manager.','Run the role analysis, review the findings, then keep, edit, remove or flag anything that needs HM confirmation.','Hiring Requirement Diagnostic + HM questions + search lanes + recruiter decision');
  addGuide(4,'Build a practical search plan and test the market.','Instead of guessing where talent is, you will create search lanes and record what you actually observe in your approved sourcing tools.','Review the suggested search architecture, run your searches, then add the real evidence you observe.','Verified search architecture + talent-supply view');
  addGuide(5,'Decide which company pools are worth sourcing from.','A long company list is not useful unless you know why each company belongs in the search and whether the evidence is verified.','Review each suggested company, verify the rationale/evidence and keep only the pools you would actually source.','Recruiter-verified target company map');
  addGuide(6,'Test whether geography is helping or hurting the search.','Location can quietly narrow a search. This step helps you separate real evidence from assumptions about talent density, remote work or relocation.','Add location evidence you have observed and decide whether to keep, test or broaden the geography.','Evidence-backed location recommendation');
  addGuide(7,'Check whether the hiring budget is supported by comparable evidence.','Mixed salary data can create false confidence. This step forces like-for-like comparison before you advise the hiring manager.','Add the best comparable compensation evidence you have, note its limitations and make a recruiter judgment.','Budget alignment assessment + HM talking point');
  addGuide(8,'Bring the evidence together and diagnose hiring feasibility.','You need to know which parts of the search are workable, constrained or still unknown before scaling sourcing.','Rate each feasibility dimension using the evidence already collected. Unknown is acceptable when the evidence is weak.','Hiring feasibility diagnosis + biggest risks + next decision');
  addGuide(9,'Turn your market evidence into a business recommendation.','This is where research becomes recruiter advisory. Every recommendation should tell the HM what the evidence means and what decision is needed.','Review the advisory draft, keep only evidence-backed recommendations and finalize the sourcing plan and HM note.','Copy-paste HM advisory recommendation');

  const s2=qs('[data-screen="2"]');
  if(s2){
    const ph={
      'roleTitle':'Example: Senior Backend Engineer',
      'location':'Example: Bangalore / Remote India',
      'experience':'Example: 6–9 years',
      'jobDescription':'Paste the JD or the requirement shared by the hiring manager.',
      'mustHaves':'Only skills the HM has explicitly said are essential.',
      'niceToHaves':'Useful, but not essential.',
      'budget':'Example: ₹35–45 LPA. Unknown is fine.',
      'noticePeriod':'Example: Immediate / 30 days / Flexible / Unknown',
      'constraints':'Example: Bangalore only, fintech background required, no relocation.',
      'unclear':'Example: I’m not sure whether domain experience is really mandatory.'
    };
    Object.entries(ph).forEach(([k,v])=>{const el=qs(`[data-role="${k}"]`);if(el)el.placeholder=v});
    const whyLabel=qs('[data-role="roleReason"]')?.closest('.field')?.querySelector('label'); if(whyLabel) whyLabel.textContent='Why is this role open?';
    const btn=qs('#saveRole'); if(btn) btn.textContent='ANALYSE THIS ROLE';
  }

  const s3=qs('[data-screen="3"]');
  if(s3){
    const make=qs('#makeDiag'); if(make) make.textContent='RUN ROLE ANALYSIS';
    const copy=qs('#copyDiag'); if(copy) copy.textContent='COPY ANALYSIS INSTRUCTIONS';
    const wrap=qs('#diagPromptWrap');
    if(wrap){
      const holder=document.createElement('details'); holder.className='advanced-details';
      holder.innerHTML='<summary>View analysis instructions</summary>';
      wrap.parentNode.insertBefore(holder,wrap); holder.appendChild(wrap);
    }
    const raw=qs('[data-diag="raw"]');
    if(raw){
      const field=raw.closest('.field');
      const label=field?.querySelector('label'); if(label) label.textContent='Paste the AI response here';
      const help=document.createElement('p'); help.className='field-help'; help.textContent='If you are using ChatGPT or Claude: click “Copy analysis instructions”, paste them there, then paste the response back here. You will verify the output before anything is accepted.';
      field?.insertBefore(help,raw);
    }
    const heading=[...s3.querySelectorAll('h3')].find(x=>x.textContent.trim()==='Recruiter verification');
    if(heading){
      const p=document.createElement('p'); p.className='section-help'; p.textContent='AI gives you a draft. You own the decision. For each finding, confirm whether it is accurate, needs editing, is unsupported, or needs hiring-manager confirmation.';
      heading.insertAdjacentElement('afterend',p);
    }
    const lock=qs('#lockDiag'); if(lock) lock.textContent='CONFIRM MY DIAGNOSTIC';
    const next=qs('#toM2'); if(next) next.textContent='BUILD MY TALENT MARKET SNAPSHOT';
  }

  const labels={
    '#makeSearch':'BUILD MY SEARCH PLAN','#makeSupply':'ANALYSE MY TALENT EVIDENCE','#makeCompanies':'BUILD COMPANY RESEARCH CANDIDATES','#makeLocation':'ANALYSE LOCATION EVIDENCE','#makeComp':'ANALYSE COMPENSATION EVIDENCE','#makeFeas':'DIAGNOSE HIRING FEASIBILITY','#makeAdvisory':'BUILD MY HM RECOMMENDATION'
  };
  Object.entries(labels).forEach(([id,text])=>{const b=qs(id);if(b)b.textContent=text});
})();