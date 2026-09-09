# Talent Market Snapshot Challenge V2 — Buyer Journey & UX

_Last updated: 09 Sep 2026_

This document is the implementation-ready companion to `TALENT_MARKET_SNAPSHOT_CHALLENGE_V2_MASTER.md`.

## Locked buyer journey

**Payment Success → Challenge Start → Module 1 Input → Module 1 Diagnostic + Recruiter Verification → Module 2 Search Architecture + Talent Supply → Target Company Mapping → Location View → Compensation Evidence → Hiring Feasibility Diagnosis → Module 3 HM Advisory → Completion / Final Outputs**

Permanent UX principle:

> **One task at a time. One decision at a time. One usable output at the end of each module.**

Permanent product workflow:

**INPUT → AI ANALYSIS → EVIDENCE → RECRUITER VERIFICATION → DECISION / RECOMMENDATION**

Every AI-generated section must use the permanent 9/10 quality-control standard from the master product document.

---

# SCREEN 1 — PAYMENT SUCCESS + CHALLENGE START

## 1A. Payment Success

Goal: confirm payment quickly and move the buyer immediately into the product.

Show:
- IAAR logo
- `Payment Confirmed` badge
- Product name
- Actual amount paid from verified transaction
- Payment status: Captured
- Payment ID
- Receipt link
- Primary CTA: **START THE CHALLENGE**
- Secondary: receipt, WhatsApp support, email-confirmation message

### Critical technical requirement

The payment-success page must not wait for delivery email completion.

Desired sequence:

**Verify Razorpay → return success to browser immediately → show confirmation → trigger tracker/email delivery independently**

The amount displayed must use the verified paid amount and must never show ₹0 when ₹1 or ₹99 was paid.

## 1B. Challenge Start

Headline: **BRING ONE REAL ROLE.**

Explain the three outputs:
1. Hiring Requirement Diagnostic
2. Talent Market Snapshot
3. Hiring Manager Advisory Recommendation

Show progress: `Step 1 of 3`.

Buyer needs:
- one real role / JD
- known hiring context
- known location / compensation / constraints if available
- access to normal recruiting tools for evidence validation

Privacy reminder: do not paste confidential candidate data, personal data, internal company secrets, or sensitive information into public AI tools unless organizational policy permits it.

Primary CTA: **START MODULE 1**

---

# SCREEN 2 — MODULE 1 INPUT: BRING YOUR LIVE ROLE

Goal: collect the minimum information required to diagnose the role without turning the page into an ATS form.

## Core fields
Required:
- Role title
- Location
- Experience range
- Job Description / hiring requirement

Context fields:
- Must-have skills stated by HM
- Nice-to-have skills
- Non-negotiables
- Target companies mentioned by HM
- Why role is open: New / Replacement / Team expansion / Backfill / Unknown
- Compensation / budget: value or Unknown
- Notice-period expectation
- Team / business context
- Recruiter uncertainty: “What are you personally unsure about in this requirement?”

Allow two entry modes:
- Paste JD
- Enter role manually

Rule:
> **Do not make up missing information just to complete the form.**

Primary CTA: **ANALYSE THE REQUIREMENT**

---

# SCREEN 3 — MODULE 1 DIAGNOSTIC + RECRUITER VERIFICATION

Goal: convert the raw requirement into a verified, evidence-ready Hiring Requirement Diagnostic.

Display sections:
1. Confirmed Requirements
2. Assumptions being treated as requirements
3. Missing Information
4. Potentially Restrictive Criteria
5. Must-have vs Nice-to-have
6. Search Lanes
7. HM Calibration Questions
8. Final Recruiter Decision

Where possible, show source tags:
- From JD
- From HM input
- From recruiter input
- AI inference — verify

Recruiter actions on AI findings:
- Keep
- Edit
- Needs HM confirmation
- Remove

Potentially restrictive requirements must be worded as needing validation; do not call a requirement “unrealistic” without market evidence.

Final recruiter decision:
- Proceed
- Clarify with HM first
- Split into multiple search lanes
- Revisit constraints

Primary CTA: **LOCK MY DIAGNOSTIC**

Locked output becomes Artifact 1 and carries forward automatically.

---

# SCREEN 4 — MODULE 2 START: SEARCH ARCHITECTURE + TALENT SUPPLY

Goal: move from a calibrated hiring requirement into verifiable market evidence.

Carry forward read-only summary:
- Role
- Location
- Experience
- Final must-haves
- Nice-to-haves
- Search lanes
- HM constraints
- Unknowns

Allow `Edit Module 1` when required.

## Search Architecture
CTA: **GENERATE SEARCH ARCHITECTURE**

Generate:
- Primary titles
- Adjacent titles
- Must-have keywords
- Skill synonyms
- Transferable skills
- Exclusions
- Direct-fit lane
- Adjacent-fit lane
- LinkedIn search logic
- Google X-Ray logic
- Naukri / Resdex logic where relevant

Clearly state that these are search suggestions, not proof that searches were executed.

Recruiter verifies each element: Keep / Edit / Remove.

## Talent Supply Evidence
Recruiter runs searches in approved tools and records:
- Platform
- Date
- Geography
- Search / filters
- Observed result count if platform shows it
- Active / recent signal if available
- Quality / noise / duplicate notes

Rule:
> **Search-result counts are directional signals, not automatically the true available talent pool.**

AI then interprets only supplied evidence into verified observations, directional signals, search-quality issues, restrictive filters, alternative lanes, and missing evidence.

Primary CTA: **CONTINUE TO TARGET COMPANY MAPPING**

---

# SCREEN 5 — TARGET COMPANY MAPPING

Goal: build a defensible source-company map rather than a random competitor list.

CTA: **BUILD TARGET COMPANY MAP**

Three tiers:
- Tier 1 — Direct Fit
- Tier 2 — Adjacent Fit
- Tier 3 — Alternative Pool

Each company card contains:
- Company name
- Tier
- Why suggested
- Requirement mapped to
- Likely transferable experience
- Evidence available
- What must be verified
- Confidence: Verified / Directional / Unknown

Recruiter actions:
- Keep
- Edit
- Move Tier
- Remove

Rule:
> **Potential source company ≠ verified source company.**

A retained company should have a clear reason based on similar role, technical complexity, product/problem, domain, transferable skills, or comparable operating environment.

Primary CTA: **LOCK TARGET COMPANY MAP**

---

# SCREEN 6 — LOCATION & GEOGRAPHY VIEW

Goal: determine whether the requested geography is helping or restricting the search and identify evidence-backed alternatives.

Show:
- Primary hiring location
- Work model: Onsite / Hybrid / Remote / Unknown
- Relocation allowed: Yes / No / Unknown
- Location-specific non-negotiables
- HM position: Fixed / Flexible / Unknown

Recruiter adds evidence per location:
- Location
- Source / platform
- Search date
- Search logic / filters
- Observed result count if shown
- Role relevance / quality notes
- Relocation evidence if any
- Remote / hybrid relevance

CTA: **ANALYSE LOCATION OPTIONS**

AI output:
- Verified observations
- Directional differences
- Locations worth testing
- Evidence gaps
- Relocation assumptions
- Potential impact on search breadth

Never invent talent-density comparisons or relocation willingness.

Recruiter decision:
- Keep current location only
- Test additional locations
- Recommend broader geography
- Need more evidence
- Discuss remote / hybrid flexibility with HM

Primary CTA: **LOCK LOCATION VIEW**

---

# SCREEN 7 — COMPENSATION EVIDENCE

Goal: build a defensible compensation view from actual evidence.

Show current:
- Hiring budget / range
- Location
- Experience band
- Role / level
- Budget flexibility: Fixed / Flexible / Unknown
- Internal benchmark provided: Yes / No

Evidence hierarchy:
1. Employer-published ranges
2. Candidate-reported compensation / Resdex sample
3. Glassdoor
4. AmbitionBox
5. Other credible salary sources

Recruiter captures per observation:
- Source
- Role/title
- Location
- Experience/seniority
- Observed compensation/range
- Date
- Evidence type
- Confidence

CTA: **ANALYSE COMPENSATION EVIDENCE**

AI output:
- Verified observations
- Directional interpretation
- Conflicting evidence
- Limitations
- What appears aligned
- What may need calibration
- What remains unknown
- HM discussion points

Rules:
- Do not invent salary ranges
- Do not average incompatible sources to manufacture one number
- Do not claim “below market” unless supplied evidence supports it
- Do not treat salary-platform data as exact market truth

Budget assessment labels:
- Appears aligned
- May constrain hiring
- Not directly comparable
- Insufficient evidence

Primary CTA: **LOCK COMPENSATION VIEW**

---

# SCREEN 8 — HIRING FEASIBILITY DIAGNOSIS

Goal: bring together all verified Module 2 evidence into a decision-oriented feasibility view.

Carry forward locked evidence only.

Dimensions:
1. Talent availability
2. Skill combination
3. Location constraint
4. Compensation competitiveness
5. Experience / seniority constraint
6. Notice-period / joining constraint
7. Target-company breadth

Status options:
- Green — current evidence does not show a material constraint
- Amber — evidence shows a constraint or uncertainty worth managing
- Red — evidence shows a significant constraint that should be addressed before scaling sourcing
- Unknown — insufficient evidence for a defensible call

Rule:
> **Unknown is a valid outcome. Never force Green / Amber / Red.**

Do not calculate a numerical feasibility score or average statuses.

Overall label:
- Realistic
- Difficult
- Narrow
- Misaligned
- Still unclear

AI suggests the label; recruiter must approve or change it.

Show:
- strongest evidence supporting conclusion
- biggest risks
- evidence still missing

Recruiter decision:
- Proceed with current search
- Proceed but test additional lanes
- Clarify with HM before scaling
- Recommend changing constraints
- Collect more evidence first

Primary CTA: **LOCK FEASIBILITY DIAGNOSIS**

This completes Artifact 2: **Talent Market Snapshot — Final**.

---

# SCREEN 9 — MODULE 3: HIRING MANAGER ADVISORY RECOMMENDATION

Goal: convert verified evidence into a business-facing recommendation the recruiter can use with the HM.

Carry forward automatically:
- Final Hiring Requirement Diagnostic
- Locked search lanes
- Talent supply evidence
- Target company map
- Location view
- Compensation view
- Feasibility diagnosis
- Open unknowns
- Recruiter decisions

## Executive Summary
CTA: **GENERATE EXECUTIVE SUMMARY**

Output must cover:
- What appears workable
- What constrains the search
- What remains uncertain
- What needs HM decision

## Constraint Map
Classify into:
- Requirement constraint
- Market constraint
- Business constraint
- Process constraint
- Evidence gap

## Recommendation Table
Mandatory structure:

**Evidence → Implication → Recruiter Recommendation → HM Decision Required**

Every recommendation must be traceable to evidence.

## Decisions Required From HM
Generate role-specific decisions only. Recruiter can Keep / Edit / Remove.

## Recommended Sourcing Plan
Include:
- Primary search lane
- Adjacent search lane
- Target company tiers
- Geography
- Sourcing model
- What to validate first
- What not to scale yet

## Copy-Paste HM Advisory Note
Structure:
- Market view
- What is constraining the search
- My recommendation
- Decisions I need from you
- Next sourcing action

Final verification questions:
- Is every recommendation supported?
- Is anything overstated?
- Are unknowns clearly labelled?
- Are HM decisions specific?
- Can I use this with minimal editing?

Primary CTA: **LOCK HM ADVISORY RECOMMENDATION**

This completes Artifact 3.

---

# SCREEN 10 — COMPLETION / FINAL OUTPUTS

Headline: **YOUR TALENT MARKET SNAPSHOT IS READY**

Show `Challenge Complete ✓` and `3 / 3 artifacts completed`.

Three output cards:

## 1. Hiring Requirement Diagnostic
CTA: **OPEN DIAGNOSTIC**

## 2. Talent Market Snapshot
CTA: **OPEN TALENT MARKET SNAPSHOT**

## 3. Hiring Manager Advisory Recommendation
CTA: **OPEN HM ADVISORY**

Export actions:
- Print / Save Diagnostic as PDF
- Print / Save Talent Market Snapshot as PDF
- Print / Save HM Advisory as PDF

Do not overbuild persistent user accounts in the beta unless buyer use proves they are required.

## What To Do Next
1. Use the HM Advisory in the next HM discussion
2. Update assumptions after the discussion
3. Re-run market evidence when the role changes materially
4. Source against the final agreed search lane

Evidence reminder:
> Market evidence changes. Record source and date and revalidate material assumptions when role, location, compensation, or hiring conditions change.

Support:
- Talent Intelligence Guide
- Challenge Support WhatsApp group
- `hello@iamarecruiter.in`

Cohort bridge: subtle CTA to the full **AI-Enabled Strategic Talent Advisor** program after buyer value has been delivered.

---

# DATA CARRY-FORWARD RULES

The buyer must never repeatedly type information already captured.

## Module 1 → Module 2
Carry forward:
- role title
- location
- experience
- final must-haves
- nice-to-haves
- search lanes
- non-negotiables
- compensation / budget
- joining constraint
- unresolved HM questions

## Within Module 2
Each locked section feeds later sections:
- Search architecture feeds Talent Supply
- Talent Supply + Search Architecture feed Target Companies
- Locked role + evidence feed Location
- Locked role + evidence feed Compensation
- All verified evidence feeds Feasibility

## Module 1 + Module 2 → Module 3
Carry forward only locked / recruiter-verified outputs.

AI-generated but unverified claims must not silently become evidence downstream.

---

# NAVIGATION & PROGRESS RULES

- Persistent progress indicator: **Module 1 / 3 → Module 2 / 3 → Module 3 / 3**
- Within Module 2 show sub-step progress without pretending they are separate modules.
- Primary CTA must describe the next value-producing action, not generic `Next`.
- Buyer can go backward to edit prior work.
- If a locked upstream section is materially changed, downstream dependent analysis should be marked **Needs revalidation** rather than silently remaining valid.
- Auto-save form data where technically feasible.
- Do not block progression because an optional field is Unknown.
- Do block final “lock” actions where the recruiter has not reviewed mandatory AI findings.

---

# BETA STORAGE / EXPORT RULES

For V2 beta:
- Keep implementation simple.
- Store only what is needed to preserve the buyer’s progress and final artifacts.
- Avoid collecting candidate PII.
- Preserve verified vs unverified state for AI findings.
- Final artifacts must be printable / saveable as PDF.
- Persistent full user accounts are not required for the first V2 beta unless implementation needs them or buyer validation later proves value.

---

# PAYMENT & DELIVERY UX REQUIREMENTS

Before launch:
- Payment confirmation must render immediately after verified Razorpay capture and must not wait for email delivery.
- Success page must show the actual verified paid amount.
- Delivery email must be professionally branded with IAAR logo, black/yellow brand treatment, clear primary CTA, resource cards, WhatsApp support and `hello@iamarecruiter.in` footer.
- Email failure must not invalidate a successfully captured payment.
- Delivery should be idempotent so retries do not create unnecessary duplicate emails.
- Receipt remains a payment receipt until legal/GST invoice configuration exists.

---

# FULL-JOURNEY QUALITY GATE

Internal product-design assessment only; these are not buyer-validation metrics.

- Product goal clarity: **9.5/10 — PASS**
- Recruiter work relevance: **9.5/10 — PASS**
- Immediate usable outputs: **10/10 — PASS**
- Evidence discipline: **10/10 — PASS**
- Human verification: **10/10 — PASS**
- Differentiation from a generic prompt pack: **9/10 — PASS**
- Navigation / workflow clarity: **9.5/10 — PASS**
- HM advisory usefulness by design: **9.5/10 — PASS**
- Hallucination / false-precision safeguards: **10/10 — PASS**

**Overall internal product-design status: PASS for implementation.**

These scores are design judgments only. Willingness to pay, satisfaction, conversion, retention, ROI, and actual work impact remain **unproven until buyer testing**.

---

# IMPLEMENTATION ORDER

1. Build shared V2 challenge shell + progress/navigation/state model
2. Implement Screen 1 payment success + immediate redirect behavior
3. Implement Module 1 input, analysis, verification and Artifact 1
4. Implement Module 2 sub-steps and Artifact 2
5. Implement Module 3 and Artifact 3
6. Implement Completion / export screen
7. Redesign branded delivery email
8. Replace V1 eBook with supporting Talent Intelligence Guide
9. Fix payment amount display and async email behavior
10. End-to-end ₹1 admin test
11. Buyer-path test using non-admin identity when coupon-reservation safeguards are ready
12. Launch only after critical implementation and UX checks pass the permanent ≥9/10 gate

---

# STATUS

- V1: Prototype only — **DO NOT LAUNCH**
- V2 product definition: **LOCKED**
- Modules 1–3: **LOCKED**
- Screens 1–10: **LOCKED**
- Full V2 buyer journey: **LOCKED**
- Full journey internal design gate: **PASS**
- Implementation: **READY TO START**
- Buyer validation: **NOT YET PROVEN**
