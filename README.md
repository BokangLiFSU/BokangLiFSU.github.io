# Bokang Li — Academic Website

Public website: https://bokanglifsu.github.io/

This repository contains the complete website source. It builds plain HTML, CSS and JavaScript with Node.js and deploys to GitHub Pages. No GPT account, OpenAI service, database or paid plugin is required to build, publish or maintain it.

## Update content in GitHub

1. Open a file in `content/` and choose Edit.
2. Make the change, keeping JSON syntax valid.
3. Commit to `main` (or open a pull request for review).
4. The **Publish website** workflow builds, checks local links, and publishes `dist/` automatically.
5. Check the Actions tab. A successful deployment appears at the website URL above. Failed builds leave the previous deployed version in place.

| Content | File |
| --- | --- |
| Biography, appointments, education, teaching records, projects, topics | `content/site.json` |
| Journal papers and homepage selections | `content/publications.json` |
| Book chapters | `content/chapters.json` |
| Broad research interests, five future directions, study stories and teaching approach | `content/research-stories.json` |
| Academic biography, background and activity photographs | `content/site.json` (`biography`, `academicContext`, `activities`) |
| Layout and page structure | `reference-build.mjs` |
| Typography, spacing and responsive layout | `assets/reference.css` |

The biography and CV use **University of Washington, Tacoma Campus**. Reviewed conference and dissertation photographs from the author’s LinkedIn activities are included with his authorization. The homepage uses a contextual conference photograph; additional photographs, research communication and conference contributions appear on Activities. Research interests and future directions should lead; published studies illustrate that agenda.

## Local build

Use Node.js 22 or newer. There are no third-party package dependencies and no `npm install` step.

```sh
node build.mjs
node check.mjs
```

Serve the generated `dist/` directory with any static web server for browser preview. Only the files in `dist/` are deployed. The source can also be hosted on another static hosting provider.

## Publishing setup

Repository Settings → Pages → Source: **GitHub Actions**.
The workflow uses standard GitHub-hosted Linux runners and the automatically supplied GitHub token. No manually created token or billing secret is required.

## Recover from a mistake

Use the file's History to inspect earlier versions, then restore the relevant content and commit. For a larger change, revert its commit through normal Git workflows. Avoid rewriting branch history.

## Design references

Organization and typography draw on Cathy Wu's academic homepage; compact publication entries draw on Jon Barron's website; research and biographical information are kept distinct. Professional content belongs to Bokang Li and the credited coauthors. Reference-site portraits, research images and analytics are not included.

The Research page leads with a broad agenda and links to separate topic and project pages. Published case studies are examples within that agenda. Avoid filling topic pages with the entire publication list or moving long CV paragraphs back onto the homepage.
