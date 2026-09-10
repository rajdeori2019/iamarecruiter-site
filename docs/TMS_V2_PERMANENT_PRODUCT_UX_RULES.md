# TMS V2 — Permanent Product UX Rules

_Last updated: 10 Sep 2026_

These rules apply to every screen, workflow, artifact, and future IAAR digital product unless deliberately revised and documented.

## Core Product Principle

**Maximum value underneath. Minimum complexity on the surface.**

The buyer should feel that the product solves a meaningful recruiting problem without making them operate a complicated AI workflow.

Every screen must answer, within seconds:
1. What am I doing?
2. Why does this matter?
3. What do I do next?
4. What useful work output will I get?

## Experience Standard

- Keep the IAAR brand system consistent across the full flow.
- Use the approved editorial visual language: ink / cream / white / yellow accent, Archivo Black / Archivo / IBM Plex Mono, restrained borders, low-radius controls, strong hierarchy, generous whitespace.
- Do not let individual screens look like separate products.
- Avoid generic SaaS-dashboard styling and excessive cards-within-cards.
- Use yellow mainly for outcomes, current state, and primary action.
- Make the primary action visually obvious; secondary/technical controls must stay visually quiet.
- Hide technical prompt plumbing unless the user explicitly needs it.
- Prefer one task, one decision, and one usable output at a time.
- Reduce manual rewriting. Where safe and grounded, extract or carry forward previously entered information automatically.
- Do not make users reconfirm facts they entered themselves unless there is a contradiction, ambiguity, unsupported inference, or genuine decision required.
- Surface only the items that need human judgment.
- Human review must remain mandatory for AI-derived conclusions.
- Missing support remains **Unknown — requires verification**.

## Value Standard

Every step must produce something the recruiter can use immediately at work.

Permanent test:
> **What can the recruiter actually use at work immediately after completing this?**

If the answer is weak, the screen fails regardless of visual polish.

Outputs should feel materially useful, such as:
- clearer hiring requirements
- hiring-manager questions
- search lanes
- market evidence
- sourcing priorities
- constraint diagnosis
- recruiter recommendations
- copy-ready hiring-manager advisory

## Simplicity Standard

Complexity may exist in the underlying logic, but the buyer-facing workflow should be short and obvious.

Preferred interaction pattern:
**Input → AI draft / evidence processing → focused review → recruiter decision → usable output**

For external-AI beta steps, the visible workflow should be no more complex than:
**Copy → Paste → Review → Confirm**

After paste, the product should automatically organise supported output where possible and clearly show the next action.

## Recruiter Verification Standard

Do not ask the recruiter to verify every obvious carried-forward fact.

Show only items that genuinely need judgment, for example:
- assumptions
- ambiguity / contradiction
- potentially restrictive criteria
- unsupported conclusions
- items needing HM confirmation

Preferred decisions:
- Keep
- Edit
- Ask HM
- Remove

The final artifact must preserve the recruiter-reviewed result, not the raw AI draft.

## Feedback / Advocacy Rule

At challenge completion:
1. Collect product feedback first.
2. If the buyer found the product genuinely useful, offer optional LinkedIn/social sharing.
3. Ask for a referral only if the buyer indicates they are fully satisfied.
4. Never pressure the buyer to post, refer, or endorse.

## Permanent Quality Gate

Rate every major product section from 1–10.

Success = **9/10 or above only**.

Judge:
- factual grounding
- clarity
- simplicity
- ease of use
- recruiter usefulness
- perceived work value
- evidence quality
- brand consistency
- completeness
- absence of unsupported assumptions

Rules:
- No hype.
- No hallucination.
- No sugarcoating.
- Do not invent facts, figures, candidate counts, salary data, company facts, hiring demand, ROI, conversion, willingness-to-pay, or outcomes.
- Separate Fact / Inference / Assumption / Unknown where relevant.
- If evidence is missing: **Unknown — requires verification.**
- If any major section is below 9/10, revise before accepting or moving on.
- If 9/10 cannot honestly be reached because evidence is missing, state why.
- Never inflate a score to pass.

## Screen 3 Specific Rule

The Hiring Requirement Diagnostic should not show a full fact-check table for information the recruiter already entered.

After the AI response is pasted:
- auto-organise the diagnostic
- show **What is clear**
- show **What is missing**
- surface only **Items that need your attention** for assumptions, ambiguities, contradictions, or potentially restrictive criteria
- allow Keep / Edit / Ask HM / Remove
- carry the reviewed judgment into the final diagnostic
- require a final recruiter decision before moving forward
