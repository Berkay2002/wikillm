# File Type Handling Reference

How to process each source type during ingest. Read the source thoroughly before deciding on article structure.

## Markdown / Web Clips

- Extract frontmatter metadata (`source`, `url`, `title`, `author`, `date`) — preserve for citations
- Clean clipper artifacts: navigation bars, cookie banners, footers, sidebar widgets, "share this" blocks, ad placeholders
- Images referenced from `raw/assets/` — keep relative paths, don't move the images
- If the clip has a `source` or `url` field, carry it into the wiki article's `## Sources` section
- Headings in the clip often map 1:1 to concepts — each H2/H3 may warrant its own wiki article

## PDFs

- Use the Read tool with `pages` parameter (supports PDF natively)
- For large PDFs (>10 pages): read in chunks of 10-20 pages
- First pass: read the table of contents or scan headings to understand document structure
- Second pass: process section by section, extracting concepts
- Note page numbers in source citations (e.g., `raw/paper.pdf, pp. 12-15`)
- Academic papers: extract abstract, key findings, methodology notes, cited works worth following up on
- Books/reports: focus on arguments and evidence, not chapter-by-chapter summaries

## YouTube Transcripts

- Look for speaker labels (e.g., "Speaker 1:", names) and preserve attribution
- Strip timestamps from running prose, but preserve them for direct quotes (e.g., `[12:34]`)
- Extract: main thesis, key arguments, supporting evidence, notable quotes
- If the transcript is a conversation/interview, note each speaker's position
- Create articles about the *ideas discussed*, not a play-by-play of the video
- Include the video URL in sources

## Plain Text / Copy-Paste

- First, detect the structure:
  - Bullet notes / outlines → preserve hierarchy, expand into articles
  - Pasted essay / article → treat like markdown without frontmatter
  - Conversation / chat log → extract claims and ideas, attribute to speakers
  - List of items → may become a single list-article or individual entries
  - Data / tables → preserve structure, create articles about what the data shows
- For unstructured text: identify the core topic and key claims before writing articles
- If the source is fragmentary or low-context, create fewer but higher-quality articles rather than many stubs

## Code Files

- Don't create line-by-line walkthroughs
- Extract and write about:
  - **Purpose**: what the code does and why it exists
  - **Key patterns**: design decisions, architectural choices, algorithms used
  - **Dependencies and interfaces**: what it connects to, what API it exposes
  - **Concepts it implements**: the ideas behind the code
- Create articles about the *concepts* (e.g., "Observer Pattern", "Rate Limiting"), linking to the source file as an example
- If the code implements a known algorithm or pattern, link to or create an article about that pattern
