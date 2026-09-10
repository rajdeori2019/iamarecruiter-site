(()=>{
  const screen=document.querySelector('[data-screen="2"]');
  if(!screen)return;
  screen.innerHTML=`<div class="card screen2-editorial">
    <div class="eyebrow">Module 1 · Requirement Diagnostic</div>
    <h2>IS THIS ROLE ACTUALLY READY FOR SOURCING?</h2>
    <p class="lead screen2-intro">Add the role you're hiring for. We'll help you identify unclear requirements, restrictive constraints and questions to clarify before you start sourcing.</p>

    <div class="outcome-strip">
      <div class="outcome-strip__label">YOU'LL GET</div>
      <div class="outcome-strip__body"><b>Hiring Requirement Diagnostic</b><span>Clear requirements · Missing information · Restrictive criteria · HM questions · Search lanes · Recruiter recommendation</span></div>
    </div>

    <div class="journey-line"><span>YOUR JOURNEY</span><b>Requirement Diagnostic</b><i>→</i><b>Talent Market Snapshot</b><i>→</i><b>HM Advisory</b></div>

    <section class="form-section">
      <div class="form-section__head"><span>01</span><div><h3>The role</h3><p>Start with the basics you already know.</p></div></div>
      <div class="grid2"><div class="field"><label>Role title *</label><input data-role="roleTitle" placeholder="Example: Senior Backend Engineer"></div><div class="field"><label>Location *</label><input data-role="location" placeholder="Example: Bangalore / Remote India"></div></div>
      <div class="grid2"><div class="field"><label>Experience range *</label><input data-role="experience" placeholder="Example: 6–9 years"></div><div class="field"><label>Why is this role open? <em>Optional</em></label><select data-role="roleReason"><option>Unknown</option><option>New role</option><option>Replacement</option><option>Team expansion</option><option>Backfill</option></select></div></div>
      <div class="field"><label>Job description / requirement *</label><textarea data-role="jobDescription" placeholder="Paste the JD or the requirement shared by the hiring manager."></textarea></div>
    </section>

    <section class="form-section">
      <div class="form-section__head"><span>02</span><div><h3>What the hiring manager wants</h3><p>Add only what has actually been discussed. Optional fields can be left blank.</p></div></div>
      <div class="grid2"><div class="field"><label>Must-have skills <em>Optional</em></label><textarea data-role="mustHaves" placeholder="Only skills the HM has explicitly said are essential."></textarea></div><div class="field"><label>Nice-to-have skills <em>Optional</em></label><textarea data-role="niceToHaves" placeholder="Useful, but not essential."></textarea></div></div>
      <div class="grid2"><div class="field"><label>Compensation / budget <em>Optional</em></label><input data-role="budget" placeholder="Example: ₹35–45 LPA · Unknown is fine"></div><div class="field"><label>Notice-period expectation <em>Optional</em></label><input data-role="noticePeriod" placeholder="Example: Immediate / 30 days / Flexible / Unknown"></div></div>
      <div class="field"><label>Constraints / non-negotiables <em>Optional</em></label><textarea data-role="constraints" placeholder="Example: Bangalore only, fintech background required, no relocation."></textarea></div>
    </section>

    <section class="form-section form-section--focus">
      <div class="form-section__head"><span>03</span><div><h3>What is still unclear?</h3><p>This is valuable. Tell us where you are unsure instead of guessing.</p></div></div>
      <div class="field"><label>What are you personally unsure about? <em>Optional</em></label><textarea data-role="unclear" placeholder="Example: I'm not sure whether domain experience is really mandatory."></textarea></div>
    </section>

    <div class="micro-rule"><b>Rule:</b> Do not make up missing information just to complete the form.</div>
    <div class="actions screen2-actions"><button class="btn secondary" data-prev>BACK</button><button class="btn" id="saveRole">ANALYSE THIS ROLE →</button></div>
  </div>`;
})();