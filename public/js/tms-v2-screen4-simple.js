(()=>{
  const screen=document.querySelector('[data-screen="4"]');
  if(!screen)return;
  screen.innerHTML=`<div class="card standard-editorial screen4-simple">
    <div class="eyebrow">Module 2 · Talent Market Snapshot</div>
    <h2>BUILD A SEARCH PLAN YOU CAN ACTUALLY USE</h2>
    <p class="lead standard-intro">Turn your calibrated role into a practical search plan, add what you actually observe in the market, and decide what the evidence is telling you.</p>

    <div class="outcome-strip standard-outcome">
      <div class="outcome-strip__label">YOU'LL GET</div>
      <div class="outcome-strip__body"><b>Talent Supply View</b><span>Search plan · Real market evidence · What looks workable · What looks narrow · What to test next</span></div>
    </div>
    <div class="journey-line standard-journey"><span>YOUR JOURNEY</span><b>Requirement Diagnostic</b><i>→</i><b class="is-current">Talent Market Snapshot</b><i>→</i><b>HM Advisory</b></div>

    <div class="summary" id="m2Summary"></div>
    <div class="screen3-flow"><b>3 simple steps:</b><span>1. Build search plan</span><i>→</i><span>2. Add real evidence</span><i>→</i><span>3. Understand the market</span></div>

    <section class="simple-step">
      <div class="simple-step__head"><span>01</span><div><h3>Build your search plan</h3><p>Copy the analysis, paste it into ChatGPT or Claude, then paste the response back. We will organise it into a practical search plan for you to review.</p></div></div>
      <div class="actions simple-step__actions"><button class="btn" id="makeSearch">COPY SEARCH PLAN ANALYSIS</button><button class="btn secondary hidden" id="copySearch">COPY AGAIN</button></div>
      <details class="advanced-details analysis-disclosure"><summary>Need the analysis instructions? View them →</summary><div id="searchPromptWrap" class="hidden"><div class="prompt" id="searchPrompt"></div></div></details>
      <div class="field"><label>AI search-plan response</label><textarea data-m2="architectureRaw" placeholder="Paste the full response here."></textarea></div>
      <div class="paste-status" id="searchPasteStatus" aria-live="polite"></div>

      <div class="review-card-grid search-review-grid" id="searchPlanCards">
        ${[['titles','Titles to search','Primary and adjacent titles'],['skills','Skills & synonyms','Must-have keywords, variants and transferable skills'],['lanes','Search lanes','Direct-fit and adjacent-fit profile lanes'],['strings','Search strings','LinkedIn, Google X-Ray and Naukri / Resdex logic']].map(([key,title,help])=>`<article class="diag-review-card" data-search-card="${key}"><div class="diag-review-card__top"><div><h4>${title}</h4></div><button type="button" class="review-edit" data-edit-search="${key}">EDIT</button></div><p class="diag-review-card__help">${help}</p><div class="diag-review-card__content" data-search-text="${key}">Waiting for the AI response.</div><div class="diag-review-card__editor hidden" data-search-editor="${key}"></div></article>`).join('')}
      </div>
    </section>

    <section class="simple-step">
      <div class="simple-step__head"><span>02</span><div><h3>Add real market evidence</h3><p>Run the search in your approved sourcing tool and record only what you actually observe. The result count is a directional signal, not the true available talent pool.</p></div></div>
      <div id="evidenceRows"></div>
      <div class="actions"><button class="btn secondary" id="addEvidence">+ ADD ANOTHER SEARCH</button></div>
      <div class="micro-rule"><b>Evidence rule:</b> Do not estimate counts or fill gaps from memory. Record the platform, date, geography, exact search and what the tool actually showed.</div>
    </section>

    <section class="simple-step simple-step--review" id="supplyReviewSection">
      <div class="simple-step__head"><span>03</span><div><h3>Understand what the evidence is telling you</h3><p>Use only the evidence you recorded above. AI can organise the observations, but you make the recruiter decision.</p></div></div>
      <div class="actions simple-step__actions"><button class="btn" id="makeSupply">COPY EVIDENCE ANALYSIS</button><button class="btn secondary hidden" id="copySupply">COPY AGAIN</button></div>
      <details class="advanced-details analysis-disclosure"><summary>Need the analysis instructions? View them →</summary><div id="supplyPromptWrap" class="hidden"><div class="prompt" id="supplyPrompt"></div></div></details>
      <div class="field"><label>AI evidence-analysis response</label><textarea data-m2="supplyRaw" placeholder="Paste the full response here."></textarea></div>
      <div class="paste-status" id="supplyPasteStatus" aria-live="polite"></div>

      <div class="review-card-grid supply-review-grid">
        ${[['supplyWorkable','✓','What looks workable'],['supplyNarrow','!','What looks narrow'],['supplyUnknown','?','What is still unknown'],['supplyNext','→','What to test next']].map(([key,icon,title])=>`<article class="diag-review-card" data-supply-card="${key}"><div class="diag-review-card__top"><div><span class="diag-review-card__icon">${icon}</span><h4>${title}</h4></div><button type="button" class="review-edit" data-edit-supply="${key}">EDIT</button></div><div class="diag-review-card__content" data-supply-text="${key}">Waiting for the evidence analysis.</div><div class="diag-review-card__editor hidden"><textarea data-m2="${key}" placeholder="Edit only if needed."></textarea><button type="button" class="review-done" data-done-supply="${key}">DONE</button></div></article>`).join('')}
      </div>

      <div class="grid2 recruiter-decision-block"><div class="field"><label>Your recruiter view</label><select data-m2="supplyDecision"><option value="">Select</option><option>Ready to proceed</option><option>Need more evidence</option><option>Broaden the search</option><option>Revisit the requirement</option></select></div><div class="field"><label>Why?</label><textarea data-m2="recruiterInterpretation" placeholder="Summarise your decision in one or two practical sentences."></textarea></div></div>
      <div class="field hidden"><textarea data-m2="evidenceGaps"></textarea></div>
    </section>

    <div class="lock" id="m2Lock"></div>
    <div class="actions screen2-actions"><button class="btn secondary" data-prev>BACK</button><button class="btn" id="lockM2">CONFIRM MY TALENT SUPPLY VIEW →</button><button class="btn hidden" id="toCompanies">CONTINUE TO TARGET COMPANY MAP →</button></div>
  </div>`;
})();