(()=>{
  const configs={
    3:{eyebrow:'Module 1 · Requirement Diagnostic',title:'CHECK WHAT NEEDS CLARIFYING BEFORE YOU SOURCE',intro:'Review the role analysis, verify what is actually supported, and decide whether the requirement is ready to take to market.',outcome:'Hiring Requirement Diagnostic',details:'Clear requirements · Missing information · Restrictive criteria · HM questions · Search lanes · Recruiter decision',journey:'Requirement Diagnostic'},
    4:{eyebrow:'Module 2 · Talent Market Snapshot',title:'BUILD A SEARCH PLAN YOU CAN ACTUALLY USE',intro:'Turn the calibrated role into practical search lanes, then record the real talent evidence you observe in your sourcing tools.',outcome:'Talent Supply View',details:'Search lanes · Title variants · Skill logic · Real search evidence · Recruiter interpretation',journey:'Talent Market Snapshot'},
    5:{eyebrow:'Module 2 · Target Company Map',title:'MAP THE TALENT POOLS WORTH SOURCING',intro:'Review potential source companies, verify why they belong in the search, and keep only the pools you would genuinely use.',outcome:'Verified Target Company Map',details:'Direct-fit pools · Adjacent pools · Evidence status · Sourcing priority · Recruiter recommendation',journey:'Talent Market Snapshot'},
    6:{eyebrow:'Module 2 · Location View',title:'CHECK WHETHER LOCATION IS NARROWING THE SEARCH',intro:'Use evidence to decide whether the requested geography is workable, should be tested more broadly, or needs a hiring-manager decision.',outcome:'Location Recommendation',details:'Requested geography · Evidence · Trade-offs · Alternative locations · HM decision',journey:'Talent Market Snapshot'},
    7:{eyebrow:'Module 2 · Compensation View',title:'CHECK WHETHER THE BUDGET FITS THE EVIDENCE',intro:'Compare the hiring budget only against evidence that is genuinely comparable by role, level, geography and compensation basis.',outcome:'Compensation Assessment',details:'Comparable evidence · Limitations · Budget alignment · Recruiter judgment · HM talking point',journey:'Talent Market Snapshot'},
    8:{eyebrow:'Module 2 · Hiring Feasibility',title:'DIAGNOSE WHAT WILL MAKE THIS SEARCH WORK OR STALL',intro:'Bring the evidence together across talent supply, skills, location, compensation, seniority, joining constraints and target-company breadth.',outcome:'Hiring Feasibility Diagnosis',details:'7 evidence-backed dimensions · Biggest risks · Unknowns · Overall feasibility · Next decision',journey:'Talent Market Snapshot'},
    9:{eyebrow:'Module 3 · HM Advisory',title:'TURN THE MARKET EVIDENCE INTO A BUSINESS RECOMMENDATION',intro:'Convert your verified market evidence into a concise recommendation the hiring manager can understand and act on.',outcome:'HM Advisory Recommendation',details:'Executive summary · Constraints · Recommendations · HM decisions · Sourcing plan · Copy-paste HM note',journey:'HM Advisory'}
  };

  const journeyHTML=(current)=>`<div class="journey-line standard-journey"><span>YOUR JOURNEY</span><b class="${current==='Requirement Diagnostic'?'is-current':''}">Requirement Diagnostic</b><i>→</i><b class="${current==='Talent Market Snapshot'?'is-current':''}">Talent Market Snapshot</b><i>→</i><b class="${current==='HM Advisory'?'is-current':''}">HM Advisory</b></div>`;

  Object.entries(configs).forEach(([num,c])=>{
    const screen=document.querySelector(`[data-screen="${num}"]`); if(!screen)return;
    const card=screen.querySelector('.card'); if(!card)return;
    card.classList.add('standard-editorial');
    const guide=card.querySelector('.journey-guide'); if(guide)guide.remove();
    const oldEyebrow=card.querySelector(':scope > .eyebrow'); if(oldEyebrow)oldEyebrow.textContent=c.eyebrow;
    const heading=card.querySelector(':scope > h1,:scope > h2'); if(heading)heading.textContent=c.title;
    const existingLead=card.querySelector(':scope > .lead');
    if(existingLead){existingLead.textContent=c.intro;existingLead.classList.add('standard-intro');}
    else if(heading){const p=document.createElement('p');p.className='lead standard-intro';p.textContent=c.intro;heading.insertAdjacentElement('afterend',p);}
    const anchor=card.querySelector('.summary') || card.querySelector('.subcard') || card.querySelector('.actions');
    const strip=document.createElement('div');strip.className='outcome-strip standard-outcome';strip.innerHTML=`<div class="outcome-strip__label">YOU'LL GET</div><div class="outcome-strip__body"><b>${c.outcome}</b><span>${c.details}</span></div>`;
    const journey=document.createElement('div');journey.innerHTML=journeyHTML(c.journey);
    if(anchor){anchor.insertAdjacentElement('beforebegin',strip);strip.insertAdjacentElement('afterend',journey.firstElementChild);}else{card.append(strip,journey.firstElementChild);}

    card.querySelectorAll('.subcard').forEach((sub,i)=>{
      sub.classList.add('editorial-section');
      const h=sub.querySelector('h3');
      if(h && !sub.querySelector('.editorial-section__num')){
        const n=document.createElement('span');n.className='editorial-section__num';n.textContent=String(i+1).padStart(2,'0');h.insertAdjacentElement('beforebegin',n);
      }
    });
  });
})();