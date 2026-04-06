---
name: marp-cli
description: Use this skill when generating slide deck presentations from markdown. Covers Marp markdown syntax (directives, slide breaks, themes, image extensions, speaker notes), built-in themes, the wiki-to-slides workflow, and Marp CLI conversion to PDF/PPTX/HTML/images. Use whenever the user asks for slides, a presentation, a deck, or mentions Marp.
---

# Marp CLI

Generate slide deck presentations from markdown using the Marp ecosystem.

## Install Check

Before converting slides, verify Marp CLI is available:

1. Run `which marp` or `marp --version`
2. If not found, ask the user: "Marp CLI is not installed. Would you like me to install it? (`npm install -g @marp-team/marp-cli`)"
3. If the user agrees, run the install command.

## 1. Marp Markdown Syntax

### Frontmatter (required)

```yaml
---
marp: true
theme: default
paginate: true
header: "Header Text"
footer: "Footer Text"
---
```

`marp: true` enables Marp rendering. Other fields are optional but common.

### Slide Breaks

Use `---` on its own line to separate slides:

```markdown
# Slide 1
Content here

---

# Slide 2
More content
```

### Directives

Three scopes:

- **Global** (in frontmatter): apply to all slides
- **Local** (HTML comment `<!-- directive: value -->`): apply to current + subsequent slides
- **Spot** (underscore prefix `<!-- _directive: value -->`): apply to current slide only

Common directives: `theme`, `paginate`, `header`, `footer`, `backgroundColor`, `color`, `class`, `style`, `headingDivider`

### Image Extensions

**Resize:**
```markdown
![w:300](img.jpg)
![width:200px height:150px](img.jpg)
![w:50%](img.jpg)
```

**Background images:**
```markdown
![bg](img.jpg)              <!-- cover (default) -->
![bg contain](img.jpg)      <!-- contain -->
![bg fit](img.jpg)          <!-- fit -->
```

**Split layout:**
```markdown
![bg left](img.jpg)         <!-- image on left, content on right -->
![bg right:40%](img.jpg)    <!-- image on right 40%, content on left -->
```

**Multiple backgrounds** (horizontal by default):
```markdown
![bg](img1.jpg)
![bg](img2.jpg)
![bg vertical](img3.jpg)    <!-- add vertical for vertical stacking -->
```

**Filters:**
```markdown
![blur:3px](img.jpg)
![brightness:1.2](img.jpg)
![grayscale:100%](img.jpg)
```

### Speaker Notes

```markdown
<!-- This is a speaker note. It won't appear on the slide. -->
```

### Scoped Styles

```html
<style scoped>
h1 { color: red; }
</style>
```

Use `<style>` (without scoped) for global CSS.

### Other Features

- **Math**: `$inline$` and `$$block$$` (MathJax)
- **Emoji**: `:shortcode:` syntax (twemoji SVG)
- **Fitting header**: `# <!-- fit --> Long Title` auto-scales to fit

## 2. Built-in Themes

### `default`
GitHub-style, clean look. CSS vars: `--color-fg-default`, `--color-canvas-default`.
- `class: invert` for dark mode

### `gaia`
Classic Marp theme. CSS vars: `--color-background`, `--color-foreground`, `--color-highlight`.
- `class: lead` for title/section slides (centered, larger text)
- `class: invert` for dark mode

### `uncover`
Modern minimal. CSS vars: `--color-background`, `--color-foreground`, `--color-highlight`.
- `class: invert` for dark mode

All themes support `size: 4:3` in frontmatter (default is 16:9).

## 3. Common Slide Patterns

### Title Slide

```markdown
---
marp: true
theme: gaia
class: lead
---

# Presentation Title
## Subtitle
**Author Name** — Date
```

### Content Slide

```markdown
---

# Key Findings

- First important point
- Second important point
- Third important point
  - Supporting detail

<!-- Speaker notes go here for presenter reference -->
```

### Two-Column Layout

```markdown
---

# Comparison

![bg left:50%](diagram.png)

## Right Column

- Point about the diagram
- Another observation
- Key takeaway
```

### Full Background Image

```markdown
---

![bg](hero-image.jpg)

<!-- _color: white -->

# Bold Statement
```

### Code Slide

```markdown
---

# Implementation

```python
def attention(query, key, value):
    scores = query @ key.T / sqrt(d_k)
    weights = softmax(scores)
    return weights @ value
```
```

### Section Divider

```markdown
---
<!-- _class: lead -->

# Part 2: Results
```

### Comparison (Side-by-Side)

```markdown
---

# Before vs After

![bg](before.png)
![bg](after.png)
```

## 4. Wiki to Slides Workflow

1. **Read relevant wiki articles** on the topic
2. **Outline the narrative**: what's the story arc? What should the audience learn?
3. **Structure into slides**: 1 idea per slide, max ~6 bullet points per slide
4. **Write Marp markdown** to `outputs/slides/YYYY-MM-DD-topic.md`
5. **Convert** to desired format (see CLI section below)
6. **File back**: if the presentation reveals new connections or insights, create/update wiki articles

## 5. CLI Quick Reference

```bash
# Convert to HTML (default)
marp slide.md
marp slide.md -o output.html

# Convert to PDF
marp slide.md --pdf
marp slide.md -o output.pdf

# Convert to PowerPoint
marp slide.md --pptx
marp slide.md -o output.pptx

# Convert to images
marp slide.md --images png

# Watch mode (auto-rebuild on save)
marp -w slide.md

# Server mode (serve directory with live reload)
marp -s ./slides-dir

# Allow local images in PDF/PPTX
marp slide.md --pdf --allow-local-files

# PDF with speaker notes as annotations
marp slide.md --pdf --pdf-notes

# Set metadata
marp slide.md --pdf --title "My Talk" --author "Name"
```

For the complete CLI reference with all options, read `references/cli-reference.md`.
