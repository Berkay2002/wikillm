# Marp CLI Reference

Generated from `marp --help` on 2026-04-06.

## Usage

```
marp [options] <files...>
marp [options] -I <dir>
```

## Basic Options

| Flag | Description | Default |
|------|-------------|---------|
| `-v, --version` | Show versions | |
| `-h, --help` | Show help | |
| `-d, --debug` | Show debug logs (bool or filter pattern) | `false` |
| `-o, --output` | Output file path (or directory when input-dir is passed) | |
| `-I, --input-dir` | Base directory to find markdown and theme CSS | |
| `-c, --config-file` | Specify path to a configuration file | |
| `--no-config-file` | Prevent looking up for a configuration file | |
| `-P, --parallel` | Number of max parallel processes for multiple conversions | `5` |
| `--no-parallel` | Disable parallel processing | |
| `-w, --watch` | Watch input markdowns for changes | |
| `-s, --server` | Enable server mode | |
| `-p, --preview` | Open preview window | |

## Converter Options

| Flag | Description | Default |
|------|-------------|---------|
| `--pdf` | Convert slide deck into PDF | |
| `--pptx` | Convert slide deck into PowerPoint document | |
| `--pptx-editable` | [EXPERIMENTAL] Generate editable PPTX | |
| `--notes` | Convert slide deck notes into a text file | |
| `--image` | Convert first slide into an image file (`png` or `jpeg`) | |
| `--images` | Convert slide deck into multiple image files (`png` or `jpeg`) | |
| `--image-scale` | Scale factor for rendered images | `1` (or `2` for PPTX) |
| `--jpeg-quality` | Set JPEG image quality | `85` |
| `--allow-local-files` | Allow access to local files from Markdown while converting (NOT SECURE) | |

## Template Options

| Flag | Description | Default |
|------|-------------|---------|
| `--template` | Choose template (`bare` or `bespoke`) | `bespoke` |
| `--bespoke.osc` | Use on-screen controller | `true` |
| `--bespoke.progress` | Use progress bar | `false` |
| `--bespoke.transition` | Use transitions (View Transition API) | `true` |

## Browser Options

| Flag | Description | Default |
|------|-------------|---------|
| `--browser` | Browser for PDF/PPTX/image conversion (`auto`, `chrome`, `edge`, `firefox`) | `auto` |
| `--browser-path` | Path to browser executable | auto-detect |
| `--browser-protocol` | Protocol for browser connection (`cdp` or `webdriver-bidi`) | `cdp` |
| `--browser-timeout` | Timeout per browser operation in seconds (0 to disable) | `30` |

## PDF Options

| Flag | Description | Default |
|------|-------------|---------|
| `--pdf-notes` | Add presenter notes to PDF as annotations | |
| `--pdf-outlines` | Add outlines (bookmarks) to PDF | |
| `--pdf-outlines.pages` | Make outlines from slide pages | `true` |
| `--pdf-outlines.headings` | Make outlines from Markdown headings | `true` |

## Metadata Options

| Flag | Description |
|------|-------------|
| `--title` | Define title of the slide deck |
| `--description` | Define description of the slide deck |
| `--author` | Define author of the slide deck |
| `--keywords` | Define comma-separated keywords |
| `--url` | Define canonical URL |
| `--og-image` | Define Open Graph image URL |

## Marp / Marpit Options

| Flag | Description |
|------|-------------|
| `--engine` | Select Marpit based engine by module name or path |
| `--html` | Enable or disable HTML tags |
| `--theme` | Override theme by name or CSS file |
| `--theme-set` | Path to additional theme CSS files |
