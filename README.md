# rupendra248.github.io

Academic website for **Dr. Rupendra Pratap Singh Hada**, Assistant Professor in the School
of Computer Science and Engineering at IILM University, Gurugram; PhD in Computer Science,
IIT Indore (2021–2025).

Live at [rupendra248.github.io](https://rupendra248.github.io/).

## Pages

| Page | Contents |
|---|---|
| `index.html` | Research statement, research areas, selected publications |
| `about.html` | Biography, interests, details |
| `research.html` | Ongoing projects and doctoral research with figures |
| `publications.html` | Peer-reviewed papers with abstracts, BibTeX and DOIs |
| `resume.html` | Appointments, education, teaching, academic service |
| `skills.html` | Technical areas |
| `contact.html` | Contact details and enquiry form |

## Build

None. Hand-written static HTML with a single stylesheet, served directly by GitHub Pages
from `main`. No bundler, no framework, and no JavaScript of our own — the only script on
the page is Google Analytics. Disclosures use native `<details>`, and the figure galleries
use CSS scroll-snap.

- `assets/css/style.css` — the whole design system
- `assets/img/` — portrait, research figures (WebP), social share card
- `assets/resume/` — CV PDF
- `sitemap.xml`, `robots.txt` — indexing

Typeset in Source Serif 4 and IBM Plex Mono, loaded from Google Fonts.

## Editing

Every page shares a masthead, section grid and colophon; edit the matching block in each
page so they stay consistent. Structured data lives in `<script type="application/ld+json">`
in `index.html` (Person) and `publications.html` (publication list) — update it whenever the
corresponding visible content changes.

The contact form posts to Formspree; the endpoint is in `contact.html`.
