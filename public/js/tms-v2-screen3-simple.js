(()=>{
  const screen=document.querySelector('[data-screen="3"]');
  if(!screen)return;
  screen.innerHTML=`<div class="card standard-editorial screen3-simple">
    <div class="eyebrow">Module 1 · Requirement Diagnostic</div>
    <h2>CHECK WHAT NEEDS CLARIFYING BEFORE YOU SOURCE</h2>
    <p class="lead standard-intro">Use your role details to create a recruiter-ready diagnostic: what is clear, what is missing, what may restrict the search, and what to take back to the hiring manager.</p>

    <div class="outcome-strip standard-outcome">
      <div class="outcome-strip__label">YOU'LL GET</div>
      <div class="outcome-strip__body"><b>Hiring Requirement Diagnostic</b><span>Clear requirements · Assumptions · Missing information · Restrictive criteria · HM questions · Search lanes · Recruiter decision</span></div>
    </div>
    <div class="journey-line standard-journey"><span>YOUR JOURNEY</span><b class="is-current">Requirement Diagnostic</b><i>→</i><b>Talent Market Snapshot</b><i>→</i><b>HM Advisory</b></div>

    <div class="summary" id="roleSummary"></div>

    <div class="screen3-flow"><b>3 simple steps:</b><span>1. Copy</span><i>→</i><span>2. Paste</span><i>→</i><span>3. Review & confirm</span></div>

    <section class="simple-step">
      <div class="simple-step__head"><span>01</span><div><h3>Copy the analysis</h3><p>Click once, then paste the copied instructions into ChatGPT or Claude.</p></div></div>
      <div class="actions simple-step__actions"><button class="btn" id="makeDiag">COPY ANALYSIS</button><button class="btn secondary hidden" id="copyDiag">COPY AGAIN</button></div>
      <details class="advanced-details analysis-disclosure"><summary>Need the analysis instructions? View them →</summary><div id="diagPromptWrap" class="hidden"><div class="prompt" id="diagPrompt"></div></div></details>
    </section>

    <section class="simple-step">
      <div class="simple-step__head"><span>02</span><div><h3>Paste the response</h3><p>Copy ChatGPT/Claude's full response and paste it below. The diagnostic sections will be filled automatically where the headings are recognised.</p></div></div>
      <div class="field"><label>AI analysis response</label><textarea data-diag="raw" placeholder="Paste the full response here."></textarea></div>
      <div class="paste-status" id="diagPasteStatus" aria-live="polite"></div>
    </section>

    <section class="simple-step simple-step--review" id="diagReviewSection">
      <div class="simple-step__head"><span>03</span><div><h3>Review & confirm your diagnostic</h3><p>Check what was extracted, edit anything inaccurate, keep unknowns visible, then make your recruiter decision.</p></div></div>

      <div class="diagnostic-grid">
        <div class="field"><label>What is clear</label><textarea data-diag="confirmed" placeholder="Confirmed requirements supported by the JD or HM discussion."></textarea></div>
        <div class="field"><label>Assumptions to confirm</label><textarea data-diag="assumptions" placeholder="Anything being treated as a requirement without clear confirmation."></textarea></div>
        <div class="field"><label>What is missing</label><textarea data-diag="missing" placeholder="Information you still need before or during sourcing."></textarea></div>
        <div class="field"><label>What may restrict the search</label><textarea data-diag="restrictive" placeholder="Criteria that may unnecessarily narrow the search, subject to HM confirmation."></textarea></div>
      </div>

      <div class="subcard editorial-section screen3-fact-check"><span class="editorial-section__num">04</span><h3>Verify the role facts</h3><p class="section-help">AI gives you a draft. You own the decision. Confirm the original role facts and flag anything that needs hiring-manager confirmation.</p><div style="overflow:auto"><table class="verify"><thead><tr><th>Role fact</th><th>Your decision</th><th>Note</th></tr></thead><tbody id="verifyBody"></tbody></table></div></div>

      <div class="grid2"><div class="field"><label>Questions to ask the hiring manager</label><textarea data-diag="hmQuestions" placeholder="Questions that will help calibrate the role."></textarea></div><div class="field"><label>Recommended search lane(s)</label><textarea data-diag="searchLanes" placeholder="The title / skill / profile lanes you would actually search."></textarea></div></div>
      <div class="grid2"><div class="field"><label>Your recruiter decision</label><select data-diag="finalDecision"><option value="">Select</option><option>Proceed</option><option>Clarify with HM first</option><option>Split into multiple search lanes</option><option>Revisit constraints</option></select></div><div class="field"><label>Why?</label><textarea data-diag="decisionReason" placeholder="Explain the decision in one or two practical sentences."></textarea></div></div>
    </section>

    <div class="lock" id="diagLock"></div>
    <div class="actions screen2-actions"><button class="btn secondary" data-prev>BACK</button><button class="btn" id="lockDiag">REVIEW & CONFIRM MY DIAGNOSTIC →</button><button class="btn hidden" id="toM2">BUILD MY TALENT MARKET SNAPSHOT →</button></div>
  </div>`;
})();