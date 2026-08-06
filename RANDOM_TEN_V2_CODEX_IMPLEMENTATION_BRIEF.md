# Random Ten V2 — Codex Implementation Brief

## 1. Objective

Rebuild the Random Ten homepage as a scroll-led, editorial discovery experience.

The product should feel:
- intelligent
- human
- psychologically clear
- restrained
- experimental without feeling like a game
- credible at an early stage

The homepage must explain the system in this sequence:

1. Navigation and Hero
2. Paradox of Choice
3. Random Ten Method
4. Explore → Discover → Master
5. Thirty-Skill World
6. Founder Journey
7. Community
8. Founding Offer
9. Final Close and Footer

Do not preserve the old visual design. Preserve only backend behaviour that is already working.

---

## 2. Existing Stack

Retain:
- Node.js
- Express
- EJS
- SQLite
- Vanilla JavaScript
- Existing `/api/waitlist` behaviour, unless the current implementation requires a small compatibility adjustment

Do not introduce:
- React
- Vue
- Tailwind
- Bootstrap
- a component framework
- GSAP during the first implementation pass
- new backend dependencies unless essential

Before editing, inspect:
- `server.js`
- `views/index.ejs`
- `public/css/style.css`
- current static-file configuration
- current waitlist route and database schema
- package scripts

Run the existing project before making changes and record any pre-existing errors.

---

## 3. Safety Rules

1. Work only on the V2 branch or duplicated V2 project.
2. Do not delete the database.
3. Do not rename or remove `/api/waitlist`.
4. Do not expose secrets or environment variables.
5. Do not publish or deploy.
6. Do not invent testimonials, experts, events, venues, participant counts, cohort dates or partnerships.
7. Do not show a paid price as confirmed. Use “Founding price announced before applications open.”
8. Do not imply that the complete twelve-month programme is already operational.
9. Do not alter unrelated routes.
10. After every implementation phase, run the site and report changed files and remaining issues.

---

## 4. Design System

Use one visual system only.

### Colours

```css
:root {
  --rt-bg: #F5F3EE;
  --rt-surface: #FFFFFF;
  --rt-text: #0A0A0A;
  --rt-muted: #68645E;
  --rt-red: #D94335;
  --rt-red-dark: #A92E25;
  --rt-border: #D9D5CD;
  --rt-black: #080808;
  --rt-white: #FFFFFF;
}
```

Approximate visual balance:
- 80% warm off-white
- 15% black
- 5% red

### Typography

Use DM Sans only.

Remove:
- Cormorant Garamond
- italic display headings
- serif typography
- decorative script styles

Suggested scale:

```css
--step--1: clamp(0.78rem, 0.74rem + 0.15vw, 0.88rem);
--step-0: clamp(1rem, 0.95rem + 0.2vw, 1.125rem);
--step-1: clamp(1.25rem, 1.1rem + 0.65vw, 1.75rem);
--step-2: clamp(1.75rem, 1.35rem + 1.4vw, 2.75rem);
--step-3: clamp(2.4rem, 1.65rem + 2.8vw, 4.75rem);
--step-4: clamp(3.2rem, 2rem + 4.6vw, 7rem);
```

Headlines:
- uppercase where specified
- bold
- tight line-height
- no italics
- no gradient text

Body copy:
- readable
- maximum line length around 60–70 characters
- minimum 16px on mobile

### Layout

- maximum content width: approximately 1280px
- desktop side padding: 32–48px
- mobile side padding: 20px
- large vertical spacing
- asymmetrical editorial layouts
- avoid repetitive card grids

### Buttons

Primary:
- red background
- white text
- dark-red hover
- square or subtly rounded corners
- no glow
- no large shadow

Secondary:
- transparent
- visible border
- clear hover inversion

### Forbidden visual treatments

Do not use:
- navy
- gold
- orange accent systems
- gradients
- grain overlays
- giant decorative “10”
- fake avatars
- glossy SaaS mockups
- emoji skill icons
- excessive shadows
- large pill-shaped UI everywhere
- generic three-card feature rows
- casino or slot-machine styling

---

## 5. Recommended File Architecture

Use this structure unless the existing project has a strong reason not to:

```text
data/
  skills.js

views/
  index.ejs

public/
  css/
    style.css
  js/
    home.js
  images/
    logo/
    founder/
    skills/
    community/
    placeholders/
```

Optional after the homepage becomes stable:

```text
views/
  partials/
    nav.ejs
    waitlist-modal.ejs
    footer.ejs
```

Do not fragment the page into many partials during the first pass.

### Skills data

Create one authoritative `data/skills.js` source.

The server should pass the skills into `index.ejs`.

Expose the same data safely to frontend JavaScript using an application/json script element:

```ejs
<script id="skills-data" type="application/json"><%- JSON.stringify(skills).replace(/</g, '\\u003c') %></script>
```

Do not manually duplicate the thirty skills in HTML and JavaScript.

---

## 6. Thirty-Skill Dataset

Use these exact skills and stable IDs:

```js
[
  { id: 1, name: "Pottery", category: "Craft & Making" },
  { id: 2, name: "Carpentry", category: "Craft & Making" },
  { id: 3, name: "Leather Craft", category: "Craft & Making" },
  { id: 4, name: "Candle Making", category: "Craft & Making" },
  { id: 5, name: "Textile Design", category: "Craft & Making" },
  { id: 6, name: "Upcycling", category: "Craft & Making" },

  { id: 7, name: "Photography", category: "Visual Art & Design" },
  { id: 8, name: "Calligraphy", category: "Visual Art & Design" },
  { id: 9, name: "Illustration", category: "Visual Art & Design" },
  { id: 10, name: "Videography", category: "Visual Art & Design" },
  { id: 11, name: "Street Art", category: "Visual Art & Design" },
  { id: 12, name: "Graphic Design", category: "Visual Art & Design" },

  { id: 13, name: "Beatmaking", category: "Music & Performance" },
  { id: 14, name: "Music Production", category: "Music & Performance" },
  { id: 15, name: "Stand-Up Comedy", category: "Music & Performance" },
  { id: 16, name: "Voice Acting", category: "Music & Performance" },
  { id: 17, name: "Spoken Word", category: "Music & Performance" },

  { id: 18, name: "Tattooing", category: "Body Art & Expression" },
  { id: 19, name: "Hairdressing", category: "Body Art & Expression" },

  { id: 20, name: "Sound Healing", category: "Wellness & Human Development" },
  { id: 21, name: "Yoga Instruction", category: "Wellness & Human Development" },
  { id: 22, name: "Skincare Formulation", category: "Wellness & Human Development" },
  { id: 23, name: "Life Coaching", category: "Wellness & Human Development" },

  { id: 24, name: "Bread Making", category: "Food & Beverage" },
  { id: 25, name: "Fermentation", category: "Food & Beverage" },
  { id: 26, name: "Home Barista", category: "Food & Beverage" },
  { id: 27, name: "Plant-Based Cooking", category: "Food & Beverage" },

  { id: 28, name: "Urban Gardening", category: "Nature & Sustainability" },
  { id: 29, name: "Beekeeping", category: "Nature & Sustainability" },

  { id: 30, name: "Event Planning", category: "Creative Experience" }
]
```

Add these fields to each item:
- `slug`
- `description`
- `experiment`
- `duration`
- `level`
- `format`
- `signals`
- `pathways`

Use credible, concise copy. Do not describe introductory experiences as certifications.

---

## 7. Homepage Section Requirements

## 7.1 Navigation and Hero

Navigation labels:

```text
RANDOM TEN
HOW IT WORKS
SKILLS
JOURNEY
ABOUT
JOIN
```

Desktop:
- sticky, 80px
- transparent initially
- warm-white translucent surface after scrolling
- black text on light sections
- adapt safely over black sections
- red logo/wordmark

Mobile:
- compact top bar
- accessible menu button
- full-screen or clean dropdown menu
- prevent body scroll while open
- Escape closes
- return focus to trigger after close

Hero label:

```text
A DIFFERENT WAY TO FIND DIRECTION
```

Hero headline:

```text
YOU WERE TOLD
TO CHOOSE ONE PATH.
WHAT IF THAT
WAS THE PROBLEM?
```

Hero copy:

```text
Random Ten helps you explore unfamiliar skills, understand what feels natural and make your next decision using experience—not expectation.
```

CTAs:

```text
START EXPLORING
SEE HOW IT WORKS
```

Proof line:

```text
Thirty skills. Three phases. One year of intentional exploration.
```

Hero right-side field:
- typography-led skill names
- mostly muted grey
- one name becomes red periodically
- no cards or icons
- no mouse-follow effect on touch devices
- reduced-motion version is static

Primary CTA scrolls to the paradox/randomiser.
Secondary CTA scrolls to the method.

---

## 7.2 Paradox of Choice and Randomiser

Opening:

```text
THE CHOICE PROBLEM

MORE CHOICE
DOES NOT ALWAYS
CREATE MORE FREEDOM.
```

Supporting concept:
- begin with 6 options
- progress to 12
- progress to 30
- communicate increasing choice overload
- do not make text unreadable
- do not trap scrolling

State labels:

```text
THIS FEELS MANAGEABLE.
YOU ARE STARTING TO COMPARE.
NOW WHICH ONE DO YOU CHOOSE?
```

Interruption state:

```text
THIS IS WHERE MOST PEOPLE STOP.
SO RANDOM TEN REMOVES THE DECISION.
```

Button:

```text
RANDOMISE MY TEN
```

Randomiser rules:
- use Fisher–Yates shuffle
- produce exactly 10 unique skills
- allow “RANDOMISE AGAIN”
- render result as accessible ordered list
- announce the updated result through an aria-live region
- no sound
- no flashing
- no slot-machine treatment
- no backend dependency

After result:

```text
YOUR FIRST TEN

No safe choices. No overthinking. Just genuine exposure.
```

---

## 7.3 Random Ten Method

Core framework:

```text
TRY → REFLECT → SCORE → FOLLOW THE SIGNAL
```

Opening:

```text
CLARITY DOES NOT
COME BEFORE ACTION.

IT COMES
BECAUSE OF IT.
```

Stages:
1. Try
2. Reflect
3. Score
4. Follow the Signal

Desktop:
- sticky stage navigation
- changing preview panel
- scroll and click activation
- no scroll trapping

Mobile:
- stacked accessible disclosures
- one expanded by default
- all content available without JavaScript

Scoring dimensions:
- Enjoyment
- Curiosity
- Natural Connection
- Energy
- Persistence

Separate:
- Personal Signal Score
- Opportunity Score

Disclaimer:

```text
The score is not a personality diagnosis. It is a record of your experience at one moment in time.
```

---

## 7.4 One-Year Journey

Framework:

```text
EXPLORE → DISCOVER → MASTER
```

Opening:

```text
ONE YEAR.

NOT TO PAUSE
YOUR LIFE.

TO UNDERSTAND
WHERE IT SHOULD GO.
```

Phases:
- Explore — Months 1–3
- Discover — Months 4–6
- Master — Months 7–12

Do not promise literal mastery in six months.

Clarification:

```text
Master does not mean finished. It means you have chosen to stop sampling and begin building.
```

Desktop:
- restrained sticky timeline
- active phase updates while scrolling

Mobile:
- vertical path
- no horizontal timeline
- compact examples

---

## 7.5 Thirty-Skill World

Opening:

```text
THIRTY DOORS.

YOU DO NOT NEED
TO KNOW WHICH ONE
IS YOURS YET.
```

Desktop:
- editorial numbered list
- category filters
- search
- sticky preview panel
- hover previews
- click locks selection
- selected row becomes black
- no thirty-card grid
- no emoji icons

Mobile:
- expandable rows
- one open at a time
- horizontal category filter row
- no sticky side panel

Required interactions:
- filter by category
- search by name, category and signal
- “SURPRISE ME”
- result count
- keyboard navigation
- no-results state

---

## 7.6 Founder Journey

Opening:

```text
I DID NOT BUILD
RANDOM TEN BECAUSE
I HAD EVERYTHING
FIGURED OUT.

I BUILT IT
BECAUSE I DID NOT.
```

Use real assets only.

Until assets exist:
- use clearly labelled neutral placeholders
- do not use AI imagery pretending to document real events
- preserve image aspect ratios and responsive crop areas

Include:
- founder narrative
- three principles
- journey-so-far timeline
- build-in-public status
- “WHEN I THINK I CAN, I WILL.”

Transparent status copy:

```text
Random Ten is currently being built and tested.
```

Remove all unverified testimonials.

---

## 7.7 Community

Opening:

```text
DISCOVERY SHOULD
NOT HAPPEN ALONE.

THE INTERNET CAN
INTRODUCE A SKILL.

REAL PEOPLE
MAKE IT COME ALIVE.
```

Community model:

```text
DISCOVER ONLINE
MEET THE EXPERT
TRY IT IN PERSON
REFLECT WITH THE COMMUNITY
```

Show:
- expert sessions
- skill meetups
- reflection circles
- showcases
- volunteer pathway
- London-first testing strategy

Do not present:
- fictional experts
- fictional event dates
- unconfirmed venues
- unconfirmed partner logos
- fake city expansion promises

Use explicit labels such as:
- “Example session format”
- “Proposed format”
- “Currently exploring”
- “Not yet live”

Participant and collaborator CTAs must remain distinct.

---

## 7.8 Founding Offer

Use two pathways only:

```text
01 — FOLLOW THE BUILD
02 — JOIN THE EXPERIMENT
```

Waitlist:
- free
- short form
- name, email, city
- optional “What are you currently trying to figure out?”

Founding cohort:
- application only
- no payment integration in this pass
- display “Founding price announced before applications open”
- explain inclusions and limitations visibly

Do not use:
- three pricing cards
- annual £650 pricing
- fake countdowns
- fake scarcity
- guaranteed outcomes

Keep `/api/waitlist` working.

Do not build the cohort application backend until the homepage and waitlist are stable. The application CTA may open an honest “Applications opening soon” state in Phase 1.

---

## 7.9 Final Close and Footer

Final opening:

```text
YOU DO NOT NEED
THE PERFECT ANSWER.

YOU NEED
THE COURAGE TO BEGIN
AND THE EVIDENCE
TO CONTINUE.
```

Founder belief:

```text
WHEN I THINK I CAN,
I WILL.
```

Final CTA:
- Join the Founding Waitlist
- Apply for the First Cohort

Footer groups:
- Explore
- Participate
- Follow
- Contact
- Privacy
- Terms
- Accessibility

Do not publish unconfigured email addresses or dead legal links. Use disabled/plain-text placeholders with an honest “coming before paid launch” note where necessary.

---

## 8. JavaScript Architecture

Implement in `public/js/home.js`.

Use small named functions:

```text
initNavigation
initMobileMenu
initSmoothAnchors
initHeroSkillField
initChoiceSequence
initRandomiser
initMethodStages
initJourneyProgress
initSkillDirectory
initFounderFilm
initWaitlistModal
initWaitlistForm
initScrollReveals
initAnalyticsHooks
```

Rules:
- use strict mode
- guard every selector
- fail gracefully when an element is absent
- no global inline onclick handlers
- use event delegation where useful
- no unsafe `innerHTML` with user-provided data
- disable controls only while required
- restore controls after failures
- provide accessible error and success states
- respect `prefers-reduced-motion`
- pause nonessential animation when the document is hidden

### Randomisation

Use Fisher–Yates:

```js
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### Waitlist

Preserve the existing request contract unless the server proves otherwise:

```js
fetch("/api/waitlist", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, city })
});
```

Do not claim that an email was sent unless the backend actually sends one.

Success copy:

```text
YOU HAVE BEGUN.

You are now part of the earliest Random Ten community.
```

---

## 9. CSS Architecture

Rewrite `public/css/style.css` completely rather than layering V2 overrides over V1.

Recommended order:

```text
1. Tokens
2. Reset
3. Base typography
4. Accessibility utilities
5. Layout primitives
6. Buttons and controls
7. Navigation
8. Hero
9. Choice/randomiser
10. Method
11. Journey
12. Skill world
13. Founder
14. Community
15. Offer
16. Final close
17. Modal
18. Footer
19. Responsive rules
20. Reduced motion
21. Print/fallback rules where useful
```

Use:
- CSS Grid
- Flexbox
- `clamp()`
- logical properties where practical
- `:focus-visible`
- `@media (prefers-reduced-motion: reduce)`
- `@media (hover: hover) and (pointer: fine)` for hover-only effects

Do not rely on JavaScript for basic layout.

---

## 10. Accessibility

Required:
- one `h1`
- logical heading hierarchy
- skip link
- semantic sections
- visible focus states
- keyboard-operable controls
- `aria-expanded` for disclosures
- labelled forms
- live regions for randomiser and form feedback
- modal focus trap
- Escape closes modal/menu/video
- focus returns to trigger
- no information conveyed by colour alone
- sufficient contrast
- zoom support to 200%
- no scroll trapping
- captions/transcript for future film
- reduced-motion support

The homepage must remain understandable when JavaScript fails.

---

## 11. Performance

Targets:
- no heavy animation library in Phase 1
- defer scripts
- avoid large embedded SVG noise textures
- lazy-load non-hero images
- set image width and height
- use WebP/AVIF when assets arrive
- minimise layout shift
- avoid autoplay video
- do not load the founder film until requested
- no third-party analytics in the first local build

---

## 12. Mobile Rules

Breakpoint strategy should follow content, not arbitrary device models.

At narrow widths:
- collapse desktop navigation
- use full-width CTAs
- remove cursor interactions
- replace sticky split layouts with stacked sections
- replace horizontal timeline with vertical progression
- convert skill preview into disclosures
- shorten motion distance and duration
- preserve all essential limitations and offer information
- do not hide critical copy inside accordions
- no horizontal page overflow

Test at:
- 320px
- 375px
- 430px
- 768px
- 1024px
- 1440px

---

## 13. Implementation Phases

## Phase 0 — Audit

Before editing, report:
- project structure
- current start command
- homepage route
- static asset path
- waitlist endpoint
- database location
- current errors
- files that will change

Do not edit during the audit.

## Phase 1 — Foundation

Build:
- design tokens
- reset and type system
- navigation
- hero
- semantic skeleton for all nine sections
- footer
- waitlist modal
- working existing waitlist submission
- mobile navigation
- reduced-motion baseline

Do not implement advanced scroll interactions yet.

## Phase 2 — Core Interactions

Build:
- choice escalation
- randomiser
- method stage switching
- journey progress
- skill filters
- search
- surprise-me
- mobile disclosures

## Phase 3 — Editorial Refinement

Build:
- responsive layout refinements
- section transitions
- restrained scroll reveals
- placeholder asset frames
- founder-film modal shell
- status/offer clarity
- content editing pass

## Phase 4 — QA

Check:
- keyboard navigation
- modal focus
- menu focus
- no-JS fallback
- reduced motion
- form error/success states
- duplicate IDs
- console errors
- overflow
- all breakpoints
- Lighthouse accessibility/performance
- existing backend behaviour

---

## 14. Codex Output Requirements

After each phase, Codex must provide:

1. Summary of work completed
2. Exact files changed
3. Commands run
4. Test results
5. Known limitations
6. Screenshots or precise browser review instructions
7. No deployment

Do not silently change product claims or invent missing business details.

---

## 15. Phase 0 Prompt to Run First

Paste this into Codex before allowing edits:

```text
Audit this Random Ten repository for a V2 homepage rebuild.

Do not modify any file yet.

Inspect the project structure, package scripts, server entry point, Express routes, EJS rendering, public/static configuration, SQLite setup, /api/waitlist request and response contract, current index.ejs, current CSS, and current browser-side JavaScript.

Then report:
1. the exact command used to run the project;
2. the homepage route and render path;
3. the files that currently control the homepage;
4. how the waitlist form currently works;
5. any duplicate, conflicting or obsolete CSS systems;
6. any fabricated/placeholder content that should not remain in production;
7. any current console, server or rendering errors;
8. the safest file-by-file V2 migration plan;
9. anything in this brief that conflicts with the actual repository.

Do not install packages, edit files, delete data, migrate the database or deploy anything.
```

---

## 16. Phase 1 Prompt

After reviewing the audit, paste:

```text
Implement Phase 1 of the approved Random Ten V2 homepage.

Use the Random Ten V2 implementation brief in this repository as the source of truth.

Requirements:
- preserve Node, Express, EJS, SQLite and the working /api/waitlist endpoint;
- create a clean V2 design system using only DM Sans and the approved warm-white, black and red palette;
- fully replace the old homepage markup and old stylesheet rather than stacking overrides;
- remove navy, gold, gradients, Cormorant, fake avatars, the giant decorative 10, glossy SaaS mockups, emoji skill cards, unverified testimonials, unconfirmed event/city claims and current pricing claims;
- build the complete semantic skeleton for all nine approved homepage sections;
- fully implement navigation, hero, final CTA, footer, waitlist modal, mobile menu and existing waitlist submission;
- create the authoritative skills dataset and render the basic thirty-skill index from it;
- create `public/js/home.js` and remove inline onclick/script behaviour from the EJS page;
- provide progressive enhancement, visible focus, reduced-motion support and mobile layouts;
- use honest placeholders for unavailable photos and videos;
- do not implement advanced scroll choreography or the full randomiser animation yet;
- do not add dependencies;
- do not alter unrelated routes;
- do not deploy.

Before editing, create a concise change plan.
After editing, run the project, test the homepage and waitlist flow, and report exact files changed, commands run, test results and remaining Phase 2 work.
```

---

## 17. Completion Standard

Phase 1 is acceptable only when:
- the current backend still starts normally;
- the waitlist route still works;
- the homepage has one coherent V2 design system;
- all nine sections exist in the correct narrative order;
- mobile does not overflow;
- no unverified social proof remains;
- the page does not imply that future programme features already exist;
- JavaScript has no console errors;
- keyboard focus is visible;
- reduced-motion users receive usable content;
- the project has not been deployed.
