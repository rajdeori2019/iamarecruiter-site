# Talent Market Snapshot Challenge V2 — Master Product Document

_Last updated: 09 Sep 2026_

## 1. Locked V2 Product Definition

The buyer brings **one real role** and leaves with three usable artifacts:

1. **Hiring Requirement Diagnostic**
2. **Talent Market Snapshot**
3. **Hiring Manager Advisory Recommendation**

Core workflow:

**INPUT → AI ANALYSIS → EVIDENCE → RECRUITER VERIFICATION → DECISION / RECOMMENDATION**

Permanent product-quality question for every module:

> **What can the recruiter actually use at work immediately after completing this?**

If the answer is weak, the section does not pass.

The current V1 content is treated as a prototype only. Do not polish V1 further until the V2 product experience is complete and passes the quality gate.

---

## 2. Permanent Quality Gate

Every major section and every core AI prompt must be scored section-by-section from 1–10.

A section passes only at **9/10 or higher**.

Scoring dimensions:
- Recruiter usefulness
- Practicality
- Factual grounding
- Evidence quality
- Clarity
- Completeness
- Differentiation from generic free AI output
- Immediate work output
- Absence of unsupported assumptions

Rules:
- No hype.
- No hallucination.
- No sugarcoating.
- Do not invent candidate counts, salaries, company facts, market demand, hiring activity, market size, willingness-to-pay, conversion, ROI, or time savings.
- Clearly separate **Fact / Inference / Assumption / Unknown** where relevant.
- If evidence is missing, state **“Unknown — requires verification.”**
- Do not present AI judgment as verified fact.
- If a section is below 9/10, revise and score again.
- If 9/10 cannot honestly be reached because evidence is missing, state why.
- Never inflate a score simply to pass.

Permanent prompt structure:

**ROLE → TASK → OUTPUT FORMAT → EVIDENCE RULES → HUMAN VERIFICATION → QUALITY CONTROL**

---

# MODULE 1 — HIRING REQUIREMENT DIAGNOSTIC

## Objective

Turn one live role/JD into a clear, evidence-ready hiring requirement before market research or sourcing begins.

### Input
One live role / JD.

### Final Artifact
A **Hiring Requirement Diagnostic** containing:
1. Confirmed requirements
2. Assumptions
3. Missing information
4. Contradictions / unrealistic combinations
5. Must-have vs nice-to-have split
6. Search-lane definition
7. Hiring-manager calibration questions
8. Final calibrated requirement

## Recruiter Input Form

- Role title
- Business / team
- Location
- Experience range
- Current JD
- Must-have skills stated by HM
- Nice-to-have skills stated by HM
- Compensation / budget if known
- Notice-period expectation if known
- Why the role is open: New / Replacement / Expansion / Unknown
- Target companies mentioned by HM
- Non-negotiables
- Anything still unclear

Rule:
> Do not fill unknowns with assumptions just to complete the form.

## Core Prompt — Requirement Diagnostic

You are supporting a recruiter before sourcing begins.

Analyse the hiring requirement below.

Do not provide candidate counts, salary benchmarks, company recommendations or market claims unless evidence is provided.

Your job is only to diagnose the requirement.

Separate the output into:
1. Confirmed requirements
2. Assumptions being treated as requirements
3. Missing information
4. Ambiguous or contradictory requirements
5. Requirements that may unnecessarily narrow the search
6. Must-have vs nice-to-have recommendation
7. Questions the recruiter should ask the hiring manager
8. Suggested search lane(s)

For every conclusion, point back to the relevant requirement text where possible.

If there is not enough information, say **“Unknown — requires hiring-manager confirmation.”**

Hiring requirement:
[PASTE ROLE DETAILS / JD]

### QUALITY CONTROL — MANDATORY

Rate every major section from 1–10, where 10 is best.

Judge on:
- factual grounding
- clarity
- recruiter usefulness
- completeness
- evidence quality
- absence of unsupported assumptions

Rules:
- No hype.
- No hallucination.
- No sugarcoating.
- Do not invent facts, figures, candidate counts, salary data, company data, market size, or hiring conclusions.
- Use only the provided hiring requirement unless external research is explicitly requested.
- Clearly label **Fact / Inference / Assumption / Unknown** where relevant.
- If evidence is missing, say **“Unknown — requires verification.”**
- Do not present AI judgment as a verified fact.
- A section passes only at 9/10 or above.
- If below 9/10, revise and score again.
- If 9/10 cannot honestly be reached because evidence is missing, say why.
- Never inflate the score just to pass.

## Recruiter Verification

Every AI finding must be classified as:
- Accurate — Keep
- Partly accurate — Edit
- Unsupported — Remove
- Needs HM confirmation — Ask
- Already known — Confirm

Recruiter verification questions:
- Is this explicitly in the JD?
- Did the HM actually say this?
- Am I assuming this because similar roles usually require it?
- Is this truly required for Day 1 performance?
- Could this skill be learned after joining?
- Is the experience range doing real screening work?
- Are two different profiles being mixed into one requisition?

## Must-have vs Nice-to-have Diagnostic

Classify every requirement into one of four buckets:
- **A. Non-negotiable** — candidate cannot perform the core job without it
- **B. Strong preference** — useful but not essential
- **C. Transferable / adjacent** — equivalent experience may work
- **D. Unclear** — needs HM decision

## Search-Lane Diagnostic

Determine whether the role needs one or multiple search lanes.

For each lane capture:
- Title families
- Core skills
- Transferable skills
- Domain requirement
- Seniority
- Exclusions
- Unknowns

## Hiring Manager Calibration Questions

Generate 5–10 role-specific questions, for example:
- Which 3 skills are truly non-negotiable?
- If the candidate has X but not Y, should we still interview?
- Is domain experience essential or can adjacent industry experience work?
- Is exact title important, or is scope more important?
- What would make you reject a strong candidate even if the core skills match?
- Is location fixed, or can we expand if the market is narrow?
- Is compensation flexible for a scarce profile?
- Are we hiring one archetype, or are there multiple acceptable backgrounds?
- What does success in the first 6–12 months look like?
- Which current team member is closest to the profile you want?

## Final Artifact Template — Hiring Requirement Diagnostic

**Role:**
**Hiring manager:**
**Location:**
**Experience:**

### Confirmed requirements
- 

### Assumptions requiring confirmation
- 

### Missing information
- 

### Potentially restrictive requirements
- 

### Final must-haves
- 

### Nice-to-haves
- 

### Search lane(s)
**Lane 1:**
**Lane 2:**
**Lane 3:**

### HM calibration questions
1.
2.
3.
4.
5.

### Final recruiter recommendation
**Proceed / Clarify first / Split the search / Revisit constraints**

**Reason:**

---

# MODULE 2 — TALENT MARKET SNAPSHOT

## Objective

Turn the calibrated requirement from Module 1 into a usable market view based on verifiable evidence.

### Input
Final calibrated hiring requirement from Module 1.

### Final Artifact
A **Talent Market Snapshot** containing:
1. Talent supply evidence
2. Searchable title / skill variants
3. Target-company map
4. Location comparison
5. Compensation evidence
6. Hiring feasibility diagnosis
7. Evidence gaps
8. Recruiter recommendation for the search

## Recruiter Input

- Role / search lane
- Location
- Experience range
- Must-have skills
- Nice-to-have skills
- Domain requirement
- Compensation / budget
- Notice-period constraint
- Target companies already mentioned
- Known constraints
- Open questions

Rule:
> The AI must not invent market evidence. If evidence is not yet collected, the workflow should help build the search and evidence plan first.

## Step A — Build the Talent Search Map

### Prompt 1 — Search Architecture Builder

You are supporting a recruiter conducting talent-market research for a live role.

Based only on the calibrated hiring requirement below, build a structured search architecture.

Do not invent candidate counts, salary ranges, company facts, hiring demand, or market conclusions.

Produce:
1. Primary job titles
2. Adjacent / equivalent titles
3. Must-have skill keywords
4. Skill synonyms / variants
5. Transferable skills
6. Likely exclusion terms
7. Direct-fit search lane
8. Adjacent-fit search lane
9. Suggested LinkedIn keyword logic
10. Suggested Google X-Ray logic
11. Suggested Naukri / Resdex keyword logic where relevant

Clearly label any title or skill interpretation that is an inference rather than explicitly stated.

Hiring requirement:
[PASTE CALIBRATED REQUIREMENT]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

## Step B — Talent Supply Evidence

Capture:
- Platform
- Exact search date
- Geography
- Filters
- Searchable result count only if platform shows it
- Active / recent signal if platform supports it
- Notes on quality / noise / duplicates

Rule:
> Search-result counts are directional indicators, not automatically the true available talent pool.

## Step C — Interpret Talent Supply

### Prompt 2 — Talent Supply Interpreter

You are analysing recruiter-supplied talent-market evidence.

Do not generate additional candidate counts or claim market facts not present in the evidence.

Analyse only the evidence provided.

Separate:
1. Verified observations
2. Directional signals
3. Search-quality issues
4. Potentially restrictive filters
5. Alternative search lanes worth testing
6. Evidence still missing

Do not conclude that the market is “easy” or “hard” from a raw result count alone.

Evidence:
[PASTE SEARCH EVIDENCE]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

## Step D — Target Company Mapping

Build three pools:
- Tier 1 — Direct-fit companies
- Tier 2 — Adjacent talent pools
- Tier 3 — Alternative pools

For every company capture:
- Company
- Tier
- Why relevant
- Likely transferable experience
- Evidence/source
- Confidence

### Prompt 3 — Target Company Mapper

Build a target-company research framework for this hiring requirement.

Do not invent company facts.

If you have web access, use reliable current sources and cite them.

If you do not have verified evidence, propose the company as a **research candidate**, not a confirmed talent source.

Divide companies into:
1. Tier 1 — Direct fit
2. Tier 2 — Adjacent fit
3. Tier 3 — Alternative pool

For each company provide:
- Why it may be relevant
- Which requirement it maps to
- What must be verified
- Evidence/source if available

Hiring requirement:
[PASTE REQUIREMENT]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

Important distinction:
> **Potential source company ≠ verified source company.**

## Step E — Location View

Assess:
- Requested location
- Adjacent talent hubs
- Remote / hybrid constraints
- Relocation assumptions
- Evidence of role availability
- Talent-density signals only if verifiable

Do not invent geographic comparisons.

## Step F — Compensation Evidence

Evidence hierarchy:
1. Employer-published salary ranges
2. Candidate-reported compensation / Resdex sample
3. Glassdoor
4. AmbitionBox
5. Other credible salary sources

Capture for each observation:
- Source
- Role
- Location
- Experience
- Compensation
- Date
- Confidence

### Prompt 4 — Compensation Evidence Interpreter

Analyse the compensation evidence below.

Do not invent salary ranges.

Compare:
- available evidence
- requested hiring budget
- differences in role / level / geography

Separate:
- Verified evidence
- Directional interpretation
- Limitations
- What should be discussed with the hiring manager

If evidence is insufficient, say so clearly.

Evidence:
[PASTE DATA]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

## Step G — Hiring Feasibility Scorecard

Evaluate dimensions individually:
- Talent availability — Green / Amber / Red / Unknown
- Skill combination — Green / Amber / Red / Unknown
- Location constraint — Green / Amber / Red / Unknown
- Compensation competitiveness — Green / Amber / Red / Unknown
- Experience / seniority constraint — Green / Amber / Red / Unknown
- Notice-period / joining constraint — Green / Amber / Red / Unknown
- Target-company breadth — Green / Amber / Red / Unknown

Do not create a mathematical total unless a validated scoring methodology is established later.

Choose an overall label:
- Realistic
- Difficult
- Narrow
- Misaligned
- Still unclear

The label must be supported by evidence.

## Final Artifact Template — Talent Market Snapshot

**Role:**
**Search lane:**
**Market evidence date:**

### 1. Talent Supply
**Search platforms:**
**Search logic:**
**Observed evidence:**
**What it means:**
**Limitations:**

### 2. Target Companies
#### Tier 1
Company — Reason — Evidence

#### Tier 2
Company — Reason — Evidence

#### Tier 3
Company — Reason — Evidence

### 3. Location View
**Requested location:**
**Alternative locations:**
**Evidence:**
**Trade-off:**

### 4. Compensation View
**Budget:**
**Observed evidence:**
**Sources:**
**Interpretation:**
**Evidence gaps:**

### 5. Feasibility
| Dimension | Status | Evidence |
|---|---|---|
| Talent availability | | |
| Skill combination | | |
| Location | | |
| Compensation | | |
| Seniority | | |
| Joining constraint | | |
| Target-company breadth | | |

**Overall:** Realistic / Difficult / Narrow / Misaligned / Still unclear

**Why:**

### 6. Evidence & Unknowns
**Verified:**
**Directional:**
**Unknown:**

### 7. Recruiter Recommendation
**Recommended sourcing approach:**
**Recommended target pools:**
**Recommended geography:**
**Compensation discussion required:**
**HM decision required before scaling sourcing:**

---

# MODULE 3 — HIRING MANAGER ADVISORY RECOMMENDATION

## Objective

Convert the validated hiring requirement and talent-market evidence into a concise, evidence-backed business recommendation the recruiter can use directly with the hiring manager.

### Input
Validated outputs from Module 1 and Module 2.

### Final Artifact
A **Hiring Manager Advisory Recommendation** containing:
1. Executive summary
2. Key constraints
3. Evidence-backed recommendations
4. Decisions required from the hiring manager
5. Recommended sourcing plan
6. Copy-paste hiring-manager advisory note

Permanent usability test:
> **Can the recruiter use this output in a real hiring-manager conversation without rewriting it from scratch?**

If not, the module fails.

## Recruiter Input

- Role
- Search lane
- Confirmed must-haves
- Nice-to-haves
- Location
- Experience range
- Compensation / budget
- Joining constraint
- Talent supply evidence
- Target-company evidence
- Location evidence
- Compensation evidence
- Feasibility diagnosis
- Known evidence gaps
- Open hiring-manager decisions

Rule:
> The AI must use the provided evidence and must not manufacture market conclusions to make the recommendation sound stronger.

## Step A — Executive Summary

The executive summary must answer:
> **What is the market evidence telling us about this search?**

### Prompt 1 — Executive Summary Builder

You are helping a recruiter prepare an evidence-based update for a hiring manager.

Use only the hiring requirement and market evidence provided below.

Produce a concise executive summary covering:
1. What appears workable
2. What appears restrictive
3. What remains uncertain
4. What decision is needed from the hiring manager

Do not invent facts, candidate counts, salary ranges, company intelligence or market conclusions.

If evidence is weak or incomplete, state that clearly.

Keep the summary concise enough to use verbally in a hiring-manager conversation.

Evidence:
[PASTE MODULE 1 + MODULE 2 OUTPUT]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

## Step B — Constraint Diagnosis

Classify constraints into:
- **Requirement constraint** — e.g. mandatory domain background
- **Market constraint** — e.g. limited verified direct-fit supply
- **Business constraint** — e.g. fixed budget
- **Process constraint** — e.g. immediate joining expectation
- **Evidence constraint** — e.g. insufficient compensation data

Do not repeat every challenge. Identify the constraints that materially affect the hiring decision.

## Step C — Recommendation Framework

Every recommendation must follow:

**Evidence → Implication → Recommendation → HM Decision**

Example structure:

**Evidence:** Verified direct-fit profiles are concentrated in the requested location and one adjacent hub.

**Implication:** Restricting the role to one location may reduce the usable pool.

**Recommendation:** Test the requested location plus the verified adjacent hub.

**HM decision required:** Can the role consider candidates from the adjacent hub?

Rule:
> Recommendations must be traceable to evidence. Do not recommend a change solely because it sounds like standard recruiting advice.

## Step D — Recommendation Categories

Assess whether evidence supports a recommendation in each category:

### A. Role requirements
- remove unnecessary must-haves
- clarify ambiguous criteria
- split mixed profiles

### B. Geography
- keep location
- expand location
- test adjacent hubs
- consider remote / hybrid

### C. Compensation
- maintain
- calibrate
- gather more evidence
- escalate budget discussion

### D. Experience / seniority
- keep exact band
- widen band
- prioritise scope over years where supported

### E. Target companies
- stay direct-fit
- add adjacent pools
- expand industry / domain pool

### F. Joining timeline
- keep
- relax
- separate immediate joiners from longer-notice candidates

### G. Sourcing model
- volume search
- precision sourcing
- direct mapping
- referral-led
- multi-lane search

The AI should recommend changes only where evidence supports them.

## Step E — Hiring Manager Decision List

The recruiter should leave with a short list of specific decisions the hiring manager needs to make.

Examples:
- Is the domain requirement mandatory or preferred?
- Can the search include an adjacent location?
- Is the compensation ceiling fixed?
- Can longer notice-period candidates be considered?
- Is the exact experience band required, or is scope more important?

The actual questions must be role-specific and evidence-based.

## Step F — Recommended Sourcing Plan

The sourcing plan should state what the recruiter will do after alignment.

Capture:
- Search lane(s)
- Target pools
- Geography
- Sourcing model
- What should be validated before scaling
- Which HM decisions must be closed first

Do not hard-code arbitrary profile counts or activity targets unless explicitly defined as a test assumption.

## Step G — Copy-Paste HM Advisory Note

### Prompt 2 — HM Advisory Note Generator

Convert the validated hiring requirement and market evidence into a concise advisory note for the hiring manager.

The note must:
- be factual
- be concise
- clearly separate evidence from interpretation
- identify the main constraints
- recommend specific actions
- state the decisions required from the hiring manager
- avoid hype
- avoid unsupported market claims
- avoid fake precision

Use this structure:

**Market view**
[2–4 sentences]

**What is constraining the search**
[bullets]

**My recommendation**
[bullets]

**Decisions I need from you**
[bullets]

**Next sourcing action**
[1–3 bullets]

Evidence:
[PASTE VALIDATED MODULE 1 + MODULE 2 OUTPUT]

Append the permanent **QUALITY CONTROL — MANDATORY** block.

## Final Artifact Template — Hiring Manager Advisory Recommendation

**Role:**
**Date:**
**Recruiter:**

### 1. Executive Summary
[ ]

### 2. Key Constraints

**Requirement:**
[ ]

**Market:**
[ ]

**Business:**
[ ]

**Process:**
[ ]

**Evidence gaps:**
[ ]

### 3. Evidence-Backed Recommendations

| Evidence | Implication | Recommendation | HM Decision |
|---|---|---|---|
| | | | |

### 4. Decisions Required from HM
1.
2.
3.
4.
5.

### 5. Recommended Sourcing Plan

**Search lane(s):**
**Target pools:**
**Location:**
**Sourcing model:**
**Validation required before scaling:**

### 6. Copy-Paste HM Advisory Note
[ ]

---

# Implementation Order

1. Lock Module 1
2. Lock Module 2
3. Lock Module 3
4. Design the V2 buyer journey around the three final artifacts
5. Build the V2 product experience
6. Only then redesign:
   - Challenge UI
   - Workbook
   - eBook / support guide
   - Payment success page
   - Delivery email
   - Payment-confirmation speed / async delivery behavior
7. Run end-to-end buyer test
8. Do not launch until every critical section passes ≥9/10

---

# Product Status

- V1: Prototype only — **do not launch**
- V2 product definition: **Locked**
- Module 1: **Designed — passed internal product-design gate**
- Module 2: **Designed — passed internal product-design gate**
- Module 3: **Designed — passed internal product-design gate**
- V2 product architecture: **Complete**
- V2 buyer journey / UX: **Next**
- Website implementation of V2: **Not started**
- Buyer validation of V2: **Not yet proven**

Important: internal 9/10 scores are product-design judgments only, not measured customer satisfaction, conversion, willingness-to-pay, ROI or market validation.
