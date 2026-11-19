# Anki Deck (prompt)

> **How to use:** inside your course project, start a **new chat for each unit** (2–4 lectures). Fill in the brackets, paste everything below the line, and send. Say "continue" if it stops. Import the file it gives you into Anki (File → Import).
> Want cards tuned to your subject, exam and study style? Use the personalized prompt on the Anki tab (Plan + personalize) instead.

---

Make an **Anki deck** for **[COURSE CODE]: [Lectures N–M / unit]**.

**Sources:** the lecture context doc in project knowledge (use its 🎯/⭐/🗣️/🚫 flags), the slides for these lectures, and the exam blueprint if I've uploaded one. Use the course's wording, definitions and examples. Skip anything marked 🚫 not tested.

**Goal:** a deck that is enough on its own to do well on this course's exam. Every 🎯 and ⭐ item must have at least one card. Cover 🔹 items and slide content in proportion to how likely they are to be tested. Don't add outside material.

## Card rules
1. **One fact per card.** Short prompts, short answers. Split anything you'd need more than ~10 seconds to answer.
2. **Mostly cloze**, one deletion per card (`{{c1::...}}`). For lists of up to 4 items, use one card per item (c1, c2, c3) on the same note. Break longer lists into smaller groups.
3. **Basic Q&A** for "why/how" questions, comparisons and application questions.
4. **Test understanding, not just recall.** For each key concept, add at least one card that asks the student to apply it (a short scenario, an example to classify, or "what happens if…").
5. **Unambiguous fronts.** Give enough context that only one answer fits. Never "What is it called?" without saying what "it" is.
6. **Back Extra / Back field:** one line of why it matters or a memory hook, then the source, e.g. `L6 · slide 14 · 23:10`.
7. **Tags** on every note: lecture (`L06`), topic (`topic::glycolysis`), and `highyield` for 🎯/⭐ items.

## Diagrams
- **Drawn by you:** when a card is about a structure, process, cycle, graph or comparison, draw a small labelled inline SVG in the field. Single line, single quotes on attributes, `viewBox` set, no external fonts, readable on white and dark backgrounds (use mid-tone colours).
- **From the slides:** when the slide's own figure is what the exam uses (anatomy, pathways, structures, graphs, maps), use a snapshot of that slide.
  - If you can run code: render the slide page to PNG, crop it to the figure, name it `L06-s14.png`, and reference it with `<img src='L06-s14.png'>`. Use it for **image occlusion style cards** (hide one label per card by covering it with a box in the image, and put the answer on the back).
  - If you can't: put `[SLIDE IMAGE: L6 slide 14, figure name]` in the field so I can add it myself.

## Output
**If you can run code**, build a ready-to-import **`.apkg`** with all images bundled (use `genanki` if it's installed; otherwise build it with Python's `sqlite3` + `zipfile`). Deck name: `[COURSE CODE]::[unit]`. Use Anki's standard **Basic** and **Cloze** note types.

**Always also give me a `.txt` import file** in this exact format (tab-separated, one note per line, no line breaks inside fields; use `<br>` for new lines):

```
#separator:tab
#html:true
#deck:[COURSE CODE]::[unit]
#notetype column:1
#tags column:4
Cloze	The {{c1::mitochondria}} makes most of the cell's ATP.	Memory hook here. L3 · slide 8	L03 topic::cells highyield
Basic	Why does X happen?	Because Y. L4 · slide 2	L04 topic::x
```

Column 2 is the Cloze **Text** / Basic **Front**. Column 3 is **Back Extra** / **Back**.

## After the deck
List: number of cards, how many are `highyield`, any 🎯 items you couldn't turn into good cards, and any `[SLIDE IMAGE]` placeholders I need to fill.
