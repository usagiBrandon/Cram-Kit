# Lecture Context Builder (prompt)

> **How to use:** start a NEW chat, *not* inside your course project. Attach the transcript(s) and slides for **2–4 lectures** (more than that and quality drops). Fill in the brackets below, paste this whole prompt, and send. Copy the output into your course's context doc, then upload the updated doc to the project.
> If you've already built earlier lectures, also paste the current **"Exam scope at a glance"** section so the new one stays consistent.

---

**Course:** [e.g. PSYC 101, Section 002, Dr. Name]
**Lectures in this batch:** [e.g. Lecture 15 (Nov 5), 16 (Nov 12), 17 (Nov 17)]
**Exam info I know:** [e.g. Midterm 2 covers Ch 4–5; final is cumulative, ~80% post-MT2; MC + short answer]
**Attached:** [transcripts: yes/no] · [slides: PPTX / PDF / annotated PDF]

You are building the **lecture context doc** for this course. A Claude tutor will later use it to answer: *what happened in class, what was said that isn't on the slides, and what's likely tested.* Accuracy beats coverage. A tutor that confidently invents a class moment is worse than one that says "not in my notes."

## How to work

1. **Match the transcript to the slides.** Work out which slides each part of the class covered, which slides were skipped, and where the lecture stopped. Professors often run behind, so the slide deck title ≠ what happened.
2. **Find the gaps between them.** Look for:
   - things said out loud that aren't on any slide (examples, stories, extra explanations, corrections, "actually the slide is wrong")
   - blanks or click-to-reveal content in the slides that the transcript fills in
   - slides the prof rushed or skipped
3. **Collect exam signals,** and only what's actually said or done. Use the prof's own words where they matter (keep each quote under ~15 words). Grade each one:
   - **🎯 Explicit:** "this will be on the exam", "know this", "fair game", "I'd ask this"
   - **⭐ Strong:** said twice or more, a long time spent on it, a clicker/practice question, "make sure you understand", "students always get this wrong"
   - **🔹 Implied:** a learning objective on a slide, or a worked example. (Slide-only cues go here, never higher.)
4. **Collect scope limits:** "not testable", "don't memorize", "beyond this course", "you'll see this in 2nd year", "just for interest". Mark these **🚫 Not tested** only if he says so; anything inferred goes under 🔹 with "(inferred)".
5. **Fix caption errors** using the slides (auto-captions mangle names and terms). If you're unsure what was said, write it with **(?)** instead of guessing.
6. **Privacy:** don't name students or the prof's family members. Write "a student asked…" or "his daughter's example…".

## Output format (follow exactly; the tutor depends on these headings and emojis)

For **each** lecture:

```
## Lecture [N] ([Day Mon DD]): [What it was actually about]
**Slide deck:** [file/deck title] · **Slides covered:** [e.g. 1–34; 35–48 pushed to next class] · **Recording:** [timestamps refer to this lecture's transcript]

**In one line:** [the core idea of this class]

### What happened
- [mm:ss] Opened with … (ordered, 5–12 bullets; activities, demos, clickers, topics in sequence)

### Said in class, not on the slides 🗣️
- [mm:ss] [content]. *Why it matters:* [one line, if it's not obvious]

### Exam signals
- 🎯 [mm:ss] [topic]: "[short quote]"
- ⭐ [mm:ss] [topic]: [what made it strong, e.g. "came back to it three times; clicker Q"]
- 🔹 [topic]: [learning objective / worked example]

### Not tested / beyond scope 🚫
- [mm:ss] [topic]: "[short quote]"   (or "None stated.")

### Clicker & in-class questions
- **Q:** [question] → **[answer]** ([% correct if said]). *Reasoning he used:* [1–2 lines]

### Slide gaps filled
- Slide [n]: blank "_____" = **[filled term]** (from [mm:ss]), or "revealed on click: …"

### Examples, stories & memory hooks
- [the example/story in 1–2 lines, and what concept it illustrates]

### Corrections, traps & clarifications
- [anything he corrected, a common mistake he warned about, or a student Q that clarified something]

### Logistics
- [deadlines, exam scope announcements, office hours changes]. Omit if none.
```

Skip a sub-section only if it's genuinely empty (write "None stated." for 🚫 and Exam signals; never drop those two).

After all lectures, add:

```
## Scope update for this batch
### Add to "Exam scope at a glance"
- 🎯/⭐ items worth listing course-wide
### Add to "Not tested" list
- 🚫 items
### New traps
- …
### New glossary terms (term: one-line definition as the course defines it)
- …
```

## Rules
- Length: about 800–2,000 words per lecture. Dense bullets, no filler, no intro or outro.
- Everything in **"Said in class"** must actually be in the transcript. If you only have slides, write "Slides only, no transcript" under that heading and leave it empty.
- Never upgrade a signal. A slide learning objective is 🔹, even if it feels important.
- Timestamps in [mm:ss] or [h:mm:ss], taken from the transcript, so the student can jump to the recording.
- Use the course's terms and definitions exactly as the prof does. Note it if they differ from the textbook.
