# Interactive Study Guide (prompt)

> **How to use:** inside your course project, start a **new chat for each unit** (one chapter or 2–4 lectures). Attach or name the slides for that unit, fill in the brackets, and send. One unit per chat keeps each guide detailed and the chat small. If the guide is cut off, say "continue" and it will add the rest.
> Slides-only courses (no transcripts) work too: the guide just won't have "said in class" boxes.

---

Make an **interactive study guide** for **[COURSE CODE]: [unit / chapter / Lectures N–M]** as a single self-contained HTML artifact.

**Sources:** the slides for this unit, plus the lecture context doc in project knowledge if there is one (use its 🎯/⭐/🗣️/🚫 flags). Use the course's wording and definitions. Don't add topics the course didn't cover, except in clearly labelled "Beyond the course" notes.

## Layout
- **Slide-reader layout:** table of contents on the left (grouped by lecture/topic, with a dot on exam-flagged sections). One section at a time on the right. Previous/next buttons and ←/→ keys. A progress bar. Collapses to one column on phones.
- Follow the order of the slides, but merge slides that make one idea and split ones that cram several.
- Light and dark mode (respect the system setting, plus a toggle).
- Plain readable fonts, generous spacing, no walls of text: short paragraphs, bullets, tables.

## Every section includes
1. **The idea in plain language** (2–5 sentences), then the course's precise version and key terms in bold.
2. **A diagram** whenever the idea has structure, a process, a comparison, or numbers. Draw it yourself with inline SVG or canvas: labelled, colour-coded, readable in both themes. No external images.
3. **Flag boxes** where they apply:
   - 🎯 **Exam**: what to know and how it's likely asked (cite the lecture/timestamp from the context doc)
   - 🗣️ **Said in class**: content from lecture that isn't on the slides
   - ⚠️ **Trap**: the common mistake and how to avoid it
   - 🔗 **Built on later**: where this comes back
   - 💡 **Analogy / memory hook**: use the prof's examples and stories first
   - 🚫 **Not tested**: covered for context only
4. **An interactive bit wherever it teaches something a static page can't.** Examples:
   - sliders that change a graph or model (e.g. a threshold, a dose-response, a signal-detection criterion, an energy level)
   - step-through animations of a process (a pathway, a neuron firing, a reaction mechanism, an experiment design)
   - "predict, then reveal" toggles and drag-to-order sequences
   - small simulators or calculators with worked numbers
   - classify-the-example drills (e.g. "which research design is this?")
   Skip it where a diagram already does the job; don't add gimmicks.
5. **Check yourself:** 1–3 multiple-choice questions in the exam's style.
   - Before answering, I pick a confidence level (Sure / 50-50 / Guessing).
   - After answering, every option shows why it's right or wrong.
   - The score is tracked in the sidebar, including how many correct answers were guesses.

## End of the guide
- **Worked examples / application questions**, with each step revealed by a button.
- **Mixed quiz** (10–15 questions across the unit, shuffled, with explanations and the score).
- **One-page cheat sheet:** key terms, the diagrams in mini form, 🎯 items, and 🚫 items to skip. Printable.

## Technical
- One HTML file. Vanilla JS, no frameworks; Google Fonts are fine. Wrap any `localStorage` use in try/catch.
- Build it in parts if it's long (shell and navigation first, then the sections), and make sure the finished file runs without console errors.
- Accessible: real buttons, visible focus, colour isn't the only signal, and text alternatives for diagrams.
