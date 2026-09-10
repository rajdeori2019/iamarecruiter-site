# Talent Market Snapshot Challenge V2 — Buyer Experience Principles

_Last updated: 10 Sep 2026_

## Product Promise

The buyer should feel that the challenge solves a meaningful recruiting problem without making them operate a technical AI workflow.

The experience must deliver maximum practical value while remaining simple, guided and easy to complete.

## Permanent UX Rule

Every screen must answer four questions immediately:

1. **What am I doing?**
2. **Why does this matter?**
3. **What do I need to do now?**
4. **What usable output will I get?**

If a recruiter cannot answer those four questions within a few seconds, the screen fails.

## Buyer-facing workflow

The internal product architecture remains:

**INPUT → AI ANALYSIS → EVIDENCE → RECRUITER VERIFICATION → DECISION / RECOMMENDATION**

The buyer-facing experience should feel like:

**Bring role → Get guided analysis → Review what matters → Confirm recruiter judgment → Leave with a work-ready output**

The buyer should not feel that they are manually operating an AI prompt engine.

## AI interaction rule

If server-side AI is not yet integrated and copy/paste is technically required:

- Explain why the AI step is needed.
- Present it as a simple guided action.
- Use buyer language such as **Run role analysis**, **Copy analysis instructions**, and **Paste the AI response here**.
- Hide the full technical prompt by default behind an optional **View analysis instructions** control.
- Never make a large raw prompt the dominant visual element of the screen.

## Value rule

Every module must produce something the recruiter can use immediately at work.

### Module 1
Buyer should leave knowing:
- what is actually clear in the requirement
- what is assumed or missing
- what may unnecessarily narrow the search
- what to ask the hiring manager
- whether to proceed, clarify, split the search or revisit constraints

### Module 2
Buyer should leave knowing:
- how to search the market
- what evidence was actually observed
- which talent pools/companies are worth testing
- whether location or compensation is constraining the search
- how feasible the search appears, with unknowns clearly stated

### Module 3
Buyer should leave with:
- a concise evidence-backed recommendation
- decisions required from the hiring manager
- a sourcing plan
- a copy-paste HM advisory note

## Simplicity rule

Complexity may exist underneath the product, but the interface should reveal only what the buyer needs for the current decision.

Prefer:
- one task at a time
- one main CTA at a time
- short explanations
- examples where helpful
- progressive disclosure for advanced/technical detail
- clear completion state

Avoid:
- jargon without explanation
- large raw prompts
- multiple competing CTAs
- fields without purpose
- asking the recruiter to repeat information already provided
- generic AI output without recruiter verification

## Feedback, sharing and referral rule

Feedback comes **after** the buyer has completed the challenge and received the three artifacts.

Order:
1. Ask whether the challenge was genuinely useful.
2. Ask for short feedback on what solved a real problem and what should improve.
3. Only if the buyer indicates they are satisfied, optionally invite them to share their result/learning on LinkedIn or another social platform.
4. Only if they are fully satisfied, optionally ask whether they would refer another recruiter.

Never pressure the buyer to post or refer. Sharing and referral must always be optional.

## Quality gate

Every redesigned screen must score at least 9/10 on:
- clarity of purpose
- ease of use
- recruiter usefulness
- immediate work value
- evidence discipline
- no hallucination / unsupported claims
- buyer confidence about what to do next

If below 9/10, revise before moving forward.
