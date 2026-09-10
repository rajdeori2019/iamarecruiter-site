(()=>{
  const screen=document.querySelector('[data-screen="3"]');
  if(!screen)return;
  screen.innerHTML=`<div class="card standard-editorial screen3-simple">
    <div class="eyebrow">Module 1 · Requirement Diagnostic</div>
    <h2>CHECK WHAT NEEDS CLARIFYING BEFORE YOU SOURCE</h2>
    <p class="lead standard-intro">Use your role details to create a recruiter-ready diagnostic: what is clear, what is missing, what may restrict the search, and what to take back to the hiring manager.</p>

    <div class="outcome-strip standard-outcome">
      <div class="outcome-strip__label">YOU'LL GET</div>
      <div class="outcome-strip__body"><b>Hiring Requirement Diagnostic</b><span>Clear requirements · Needs confirmation · Missing information · Restrictive criteria · HM questions · Search lanes · Recruiter decision</span></div>
    </div>
    <div class="journey-line standard-journey"><span>YOUR JOURNEY</span><b class="is-current">Requirement Diagnostic</b><i>→</i><b>Talent Market Snapshot</b><i>→</i><b>HM Advisory</b></div>

    <div class="summary" id="roleSummary"></div>
    <div class="screen3-flow"><b>3 simple steps:</b><span>1. Copy</span><i>→</i><span>2. Paste</span><i>→</i><span>3. Review & confirm</span></div>

    <section class="simple-step">
      <div class="simple-step__head"><span>01</span><div><h3>Copy the analysis</h3><p>Click once, paste the copied instructions into ChatGPT or Claude, and copy its full response.</p></div></div>
      <div class="actions simple-step__actions"><button class="btn" id="makeDiag">COPY ANALYSIS</button><button class="btn secondary hidden" id="copyDiag">COPY AGAIN</button></div>
      <details class="advanced-details analysis-disclosure"><summary>Need the analysis instructions? View them →</summary><div id="diagPromptWrap" class="hidden"><div class="prompt" id="diagPrompt"></div></div></details>
    </section>

    <section class="simple-step">
      <div class="simple-step__head"><span>02</span><div><h3>Paste the response</h3><p>Paste the full AI response below. We will organise the useful parts for you. You will review everything before it is accepted.</p></div></div>
      <div class="field"><label>AI analysis response</label><textarea data-diag="raw" placeholder="Paste the full response here."></textarea></div>
      <div class="paste-status" id="diagPasteStatus" aria-live="polite"></div>
    </section>

    <section class="simple-step simple-step--review" id="diagReviewSection">
      <div class="simple-step__head"><span>03</span><div><h3>Review & confirm your diagnostic</h3><p>You do not need to rewrite the AI response. Review the findings below. Edit only what is inaccurate or incomplete.</p></div></div>

      <div class="review-card-grid">
        ${[['confirmed','✓','What is clear','Requirements supported by the role information you entered.'],['assumptions','?','Needs confirmation','Points that should not be treated as confirmed without evidence or HM confirmation.'],['missing','!','What is missing','Information still needed to make the requirement clearer.'],['restrictive','⚠','What may restrict the search','Criteria that may narrow the search and should be reviewed with the HM.']].map(([key,icon,title,help])=>`<article class="diag-review-card" data-review-card="${key}"><div class="diag-review-card__top"><div><span class="diag-review-card__icon">${icon}</span><h4>${title}</h4></div><button type="button" class="review-edit" data-edit-review="${key}">EDIT</button></div><p class="diag-review-card__help">${help}</p><div class="diag-review-card__content" data-review-text="${key}">Waiting for the AI response.</div><div class="diag-review-card__editor hidden"><textarea data-diag="${key}" placeholder="Edit this finding only if needed."></textarea><button type="button" class="review-done" data-done-review="${key}">DONE</button></div></article>`).join('')}
      </div>

      <div class="subcard editorial-section screen3-fact-check"><span class="editorial-section__num">04</span><h3>Quick fact check</h3><p class="section-help">Confirm the original role facts. If something was never confirmed, mark it for hiring-manager confirmation rather than guessing.</p><div style="overflow:auto"><table class="verify"><thead><tr><th>Role fact</th><th>Your decision</th><th>Note</th></tr></thead><tbody id="verifyBody"></tbody></table></div></div>

      <div class="grid2"><div class="field"><label>Questions to ask the hiring manager</label><textarea data-diag="hmQuestions" placeholder="Questions that will help calibrate the role."></textarea></div><div class="field"><label>Recommended search lane(s)</label><textarea data-diag="searchLanes" placeholder="The title / skill / profile lanes you would actually search."></textarea></div></div>
      <div class="grid2"><div class="field"><label>Your recruiter decision</label><select data-diag="finalDecision"><option value="">Select</option><option>Proceed</option><option>Clarify with HM first</option><option>Split into multiple search lanes</option><option>Revisit constraints</option></select></div><div class="field"><label>Why?</label><textarea data-diag="decisionReason" placeholder="Explain the decision in one or two practical sentences."></textarea></div></div>
    </section>

    <div class="lock" id="diagLock"></div>
    <div class="actions screen2-actions"><button class="btn secondary" data-prev>BACK</button><button class="btn" id="lockDiag">CONFIRM MY DIAGNOSTIC →</button><button class="btn hidden" id="toM2">BUILD MY TALENT MARKET SNAPSHOT →</button></div>
  </div>`;
})();