# 01. What Is a Local Skill?

Date: 2026-04-28

Scope: learning note. Companion to the `learning-from-cds/` chapters. This is about a separate concept — **agent skills** — that came up while reading recent CDS PRs (`#608`, `#635`, `#640`, `#646`).

---

## 1. The short version

A **skill** is a folder of plain Markdown (and sometimes shell scripts) that an AI coding agent loads on demand. It tells the agent how to do a specific kind of task — "write CDS-idiomatic React code," "translate a Figma design into CDS components," "look up CDS docs."

A **local skill** is a skill that lives **inside a repository or on your machine**, rather than being baked into the agent's training or fetched from a public registry every time.

```txt
training data:
  permanent, slow to update, can drift out of date

published packages:
  versioned, but require the agent to fetch them

local skills:
  living files in your repo / your home dir
  edit them, the next session sees the changes
```

The whole point of skills is to give an agent project-specific or org-specific instructions that **override its general behavior** without retraining anything.

---

## 2. The anatomy of a skill (CDS example)

Look at `C:/Users/zhang/00My Stuff/Coding/Learning/cds/skills/cds-code/`:

```txt
skills/cds-code/
  README.md           ← human-facing: how to install, what it does
  SKILL.md            ← agent-facing: the actual instructions
  guidelines/
    components.md
    customizing-styles.md
    icons.md
    illustrations.md
```

The two important files:

### 2.1 `SKILL.md` — what the agent reads

It starts with frontmatter that the agent runtime parses:

```md
---
name: cds-code
description: |
  Produces high quality Coinbase Design System (CDS) code for React and React Native projects.
  Always use this skill every time you are asked to create or update UI or write React or React Native code.
license: Apache-2.0
metadata:
  version: '2.0.0'
---

# CDS Code Writing Skill

## Contents
1. Part 1: Initialization | Follow these steps once per session, before you write any code
2. Part 2: Workflow | Follow these steps for all frontend coding tasks
...
```

The body is just Markdown with steps, code blocks, and links to other files in the same skill folder (`guidelines/components.md`, etc.).

When the agent activates the skill, it reads `SKILL.md`, sees something like *"Run `scripts/discover-cds-packages.sh`"*, and follows the instructions.

### 2.2 `README.md` — what humans read

Tells contributors how to install the skill, run its evals, etc. The agent doesn't strictly need it.

### 2.3 Optional supporting files

- Sub-Markdown files in `guidelines/` that `SKILL.md` references.
- Shell scripts the skill instructs the agent to run.
- Test fixtures or example outputs.

---

## 3. Why skills exist

Three reasons that come up over and over:

### 3.1 The agent's training is generic

A general-purpose coding agent doesn't know what `Box`, `HStack`, or `font="inherit"` mean in **your** design system. CDS publishes a `cds-code` skill so any agent working in a CDS-using repo can be instantly opinionated about CDS conventions.

### 3.2 Project-specific override

Even within a CDS-using repo, your project might have additional rules ("never use `<div>` directly," "prefer `useCookieRig` for animation"). A local skill captures those without you re-typing them in every chat.

### 3.3 Cheaper than fine-tuning

Skills are just Markdown. You can edit one in 30 seconds. No training run, no model upload, no provider lock-in. If you don't like the output, you change the file.

---

## 4. CDS's three skills, in one paragraph each

From `C:/Users/zhang/00My Stuff/Coding/Learning/cds/skills/`:

- **`cds-code`** — "When asked to write or update React UI, follow these steps: detect platform (web vs mobile), look up the right component, prefer responsive props over `!important`, etc." This is the everyday skill.
- **`cds-docs`** — "When asked about CDS APIs, look up the documentation through this MCP route or fetch this URL, don't guess." Pure reference-fetcher skill.
- **`cds-design-to-code`** — "When given a Figma design, follow this sequence to identify components and produce CDS code." Workflow skill, narrower than `cds-code`.

The recent PRs `#640` ("improve cds-code skill performance") and `#608` ("Agent skills cleanup") are about tuning these — same as you'd tune any other source file. Skills are just code-reviewable Markdown.

---

## 5. How a local skill gets picked up

This depends on the agent runtime. For Claude Code (this environment), skills are listed in the system context — you can see them in the `available skills` block at session start. Each entry has:

- a name (e.g. `update-config`, `vercel:nextjs`, `init`)
- a description telling the agent **when to use it**
- the actual SKILL.md content loaded only when the skill is invoked

For your bakery app, that means:

```txt
.claude/skills/
  bakery-cms/
    SKILL.md
    guidelines/
      payload-collections.md
      cookie-sheep-rig.md
```

…would, if registered with the runtime, give Claude a skill it could load when you're working on Payload collections or the cookie-sheep rig. The runtime is what tells Claude "skill X exists and here's its description."

You don't have to set up a custom skill yet. The point of this note is that **the option exists**, and the recent CDS PRs are a good reference for what the file structure looks like.

---

## 6. Skills vs other agent concepts

Easy to confuse, worth keeping straight:

```txt
skill:
  a folder of Markdown describing how to do a class of tasks
  loaded on demand, scoped to its trigger conditions

hook:
  a runtime callback configured in settings.json
  fires automatically on events (session start, file save, etc.)
  hooks can inject context, run linters, gate commits

MCP server:
  a process the agent talks to over a protocol
  exposes tools, resources, prompts to the agent
  example: cds-mcp-server exposes `list-cds-routes` to fetch docs

CLAUDE.md / AGENTS.md:
  a single project-level Markdown file the agent reads at session start
  no frontmatter, no triggers — always loaded
  good for repo-wide conventions

memory file:
  a personal notes-to-self file the agent maintains across sessions
  not the same as a skill
```

A skill is closer to **CLAUDE.md** than to a hook or an MCP server, but with two key differences:

- **Triggered, not always-on.** The agent loads the skill only when its description matches the task.
- **Composable.** A skill folder can contain sub-files referenced from `SKILL.md`. CLAUDE.md is one big file.

---

## 7. Could the bakery app benefit from a custom skill?

Probably yes, eventually. Candidates:

- **`payload-collection`** — every time you add a Payload collection, follow the same setup (slug, admin.useAsTitle, access, hooks). Encode that.
- **`cookie-sheep-rig`** — there are already careful learnings in `ai-instructions/learnings/design/cookie-sheep-rig-alignment-history-2026-04-14.md`. Promoting key parts to a skill triggers them automatically when sheep/rig files are edited.
- **`navbar-flower-language`** — the project's flower motif rules. Right now they live in CLAUDE.md and in screenshots; a skill could cite the screenshots and enforce reuse.

For now, leaving them in `CLAUDE.md` is fine. If the same instructions start showing up in five chats, that's the signal to extract a skill.

---

## 8. Recap

```txt
skill:
  a folder of Markdown an agent loads on demand
  has frontmatter (name, description, triggers) + body instructions
  can include sub-files and scripts

local skill:
  a skill that lives in your repo or your home directory
  edit-and-it-applies, no fine-tuning loop

CDS ships three of them:
  cds-code, cds-docs, cds-design-to-code

bakery app could ship its own later, when patterns repeat enough.
```

The recent CDS PRs `#608`, `#635`, `#640`, `#646` are the best place to see real skill maintenance — adding one, refactoring one, performance-tuning one, documenting them in the Getting Started section.
