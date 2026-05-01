# Git Worktrees, Explained

This doc exists because git worktrees are confusing the first time you see them, and **Claude Code uses them automatically** — meaning if you work with Claude in this repo, you will see folders appear under `.claude/worktrees/...` and wonder what they are.

This is the plain-English explanation. No prior worktree knowledge assumed.

---

## The thing nobody tells you about Git: your files aren't where you think

The lie everyone tells beginners: "your repo has files."

Not really true. Your repo has **`.git/`**, which is a database. Inside that database, every commit on every branch is stored, along with a snapshot of every file at every commit.

What about the files you SEE in your folder — `src/`, `package.json`, etc.? Those aren't really "in your repo." They're a **temporary printout of one specific snapshot from the database**.

Picture it:

```
.git/  (database — invisible, always present)
├── branch 'main'         → files: foo.ts says "x=1", package.json says version 1.0
├── branch 'feature-x'    → files: foo.ts says "x=2", package.json says version 1.1
├── branch 'hotfix'       → files: foo.ts says "x=3", package.json says version 1.0.1
└── all the history of all the commits, ever
```

When you run `git checkout main`:

1. Git looks in the database for `main`'s snapshot.
2. Git **deletes whatever was in your visible folder.**
3. Git **prints out** `main`'s files into your visible folder.
4. Now you can edit them.

Your visible folder is a **disposable printout**, not the real thing. The database is the real thing. Same way `console.log` output isn't the program — it's just a view of the program's state at one moment.

When you switch branches with `git checkout feature-x`:

1. Git deletes the visible folder contents.
2. Git prints out `feature-x`'s files instead.
3. You see different files now — not because they "moved", but because Git printed a different page from the database.

**This is why you can only see one branch at a time in normal Git: you only have ONE printout area.**

---

## The Netflix analogy

Imagine Netflix has its entire library stored in the cloud. To watch a show, you need a **TV** to display it on. Your TV can only show one show at a time. To watch a different show, you stop the current one — the screen clears — and start a new one.

Mapping:

| Netflix world | Git world |
|---|---|
| The cloud library | `.git/` (the database) |
| Your TV | Your visible folder (the working copy) |
| "Watching The Office" | Being on `main` branch |
| "Watching Breaking Bad" | Being on `feature-x` branch |
| Switching shows | `git checkout other-branch` |

You can only **watch one show at a time on one TV**. Same way you can only **see one branch at a time in one folder**.

### What if you had TWO TVs?

You buy a second TV. Both TVs talk to the same Netflix library. You can:

- Play The Office on TV 1
- Play Breaking Bad on TV 2
- Watch both at the same time

The library doesn't change. The shows don't move. You just have **two screens** showing **two different things** from the same library.

**That's a worktree.** A second "TV" — a second folder — connected to the same `.git/` database. Each folder shows whatever branch is currently "playing" on it.

---

## What a worktree actually is, mechanically

A worktree is **a second folder** that **shares the same brain** (`.git/`) as your original folder, but **shows a different branch's files**.

Mechanically:

- Your **original folder** has a real `.git/` directory (the brain).
- Each **extra worktree** is just a folder with a tiny `.git` **text file** (one line!) that says "the real brain is at `/path/to/original/.git`."
- The two folders share commits/branches/history, but show different files because they're on different branches.

```
my-repo/                       ← ORIGINAL folder
├── .git/                      ← real brain (database of everything)
├── src/...                    ← files for whatever branch is checked out here (say: 'main')
└── package.json

/somewhere-else/feature-x/     ← WORKTREE folder
├── .git                       ← TEXT FILE, says "brain lives at my-repo/.git"
├── src/...                    ← files for 'feature-x' branch
└── package.json
```

Both folders work normally — `git status`, `git commit`, `git log` all work in both. They just show different things because they're "looking at" different branches of the same brain.

---

## When worktrees actually help (concrete examples)

### Example 1: Emergency hotfix

You're 80% done editing `src/foo.ts` on branch `feature-x`. Files are messy, half-done. Boss says "prod is broken on `main`, fix it RIGHT NOW."

**Without worktrees:** options are bad — commit garbage code (ugly history), `git stash` (fragile), or clone the entire repo elsewhere (gigabytes wasted).

**With worktrees:**

```bash
git worktree add ../emergency main    # creates a sibling folder at ../emergency on 'main'
cd ../emergency
# fix the bug, commit, push
cd ../my-repo
git worktree remove ../emergency      # done, sibling folder vanishes
```

Your original `feature-x` files were never touched. You worked on **two branches simultaneously** without losing or stashing anything.

### Example 2: AI agents (this repo's main use case)

When **Claude Code** starts touching files in this repo, it creates a worktree at `.claude/worktrees/<some-name>/`. The agent's branch is checked out there. Meanwhile, **you keep working in the original folder on your own branch.** Zero interference.

When the AI is done, its branch can be merged into yours like any other branch. No special "AI mode" needed.

### Example 3: Long-running operations

Run a slow CI build or test suite in one worktree while you continue editing in another. No need to wait for the build to finish before you can switch branches.

---

## You don't *strictly* need worktrees

The user's instinct on this is correct: anything you can do with worktrees you can also do by **cloning the repo to a separate folder**. Worktrees just make it nicer:

- **Disk space:** worktrees share the `.git/` database. Cloning duplicates it (can be hundreds of MB).
- **History coherence:** commits made in one worktree show up in the others' `git log` immediately. With clones, you'd have to push and pull to share commits.
- **Less ceremony:** `git worktree add` is one command vs. `git clone` + `npm install` + `cp .env`.

For a one-off task it doesn't matter. For day-to-day "I need a second branch checked out for 10 minutes" it's much faster.

---

## Where worktrees can live

**Anywhere on disk.** Common patterns:

- **Sibling folder** (most common): `../emergency`, `../feature-x`
- **Inside the repo, in a gitignored path:** `.claude/worktrees/...` (this repo's pattern, for AI agents)
- **Anywhere else:** `/tmp/quick-test`, `~/Desktop/whatever`

Putting a worktree **inside** the repo is unusual but legal. The path needs to be gitignored so the parent repo doesn't try to track the worktree's files. Otherwise git can get confused and create stray "submodule" pointers in your tree (this repo currently has some leftover ones under `.claude/worktrees/` for that reason — harmless but worth cleaning up eventually).

---

## What this looks like in *this* repo

Right now, this repo has at least one Claude-managed worktree:

```
baked-with-blessings/                                          ← YOUR ORIGINAL repo (TV 1)
├── .git/                                                       ← THE BRAIN (one library, shared)
├── src/...                                                     ← TV 1: shows whichever branch you're on (main / a feature branch / etc.)
├── package.json
├── README.md
└── .claude/
    └── worktrees/
        └── heuristic-diffie-4b23a0/                            ← CLAUDE WORKTREE (TV 2)
            ├── .git                                            ← (text file: "brain is at ../../../.git")
            ├── src/...                                         ← TV 2: shows the 'claude/heuristic-...' branch
            ├── package.json
            └── ...
```

Both folders are **the same repo** — same brain, same history, same remote. They just have different branches checked out so the visible files differ.

Important consequences:

- A commit you make in one worktree shows up in the other's `git log` (same brain).
- They do **not** share `node_modules/` — each working copy gets its own. So Claude's worktree may need its own `pnpm install`.
- They do **not** share `.env.local` — env files are per-folder. Either copy `.env.local` over, or symlink it.

---

## Cheat sheet

```bash
# Create a worktree on an existing branch
git worktree add ../folder-name existing-branch

# Create a worktree on a brand-new branch (forks from current HEAD)
git worktree add -b new-branch-name ../folder-name

# List all worktrees attached to this repo
git worktree list

# Remove a worktree (folder must be clean — no uncommitted changes)
git worktree remove ../folder-name

# Force-remove (loses uncommitted changes in that worktree — be careful)
git worktree remove --force ../folder-name

# If a worktree folder was deleted manually, prune dangling references
git worktree prune
```

The branch in a worktree behaves like any other branch — push, pull, merge, rebase, all work the same way. You can `git checkout` any other branch from inside the worktree, with the rule that **a branch can only be checked out in ONE working tree at a time** (Git refuses to let two worktrees both have `main` open at once).

---

## Who invented worktrees

**Not GitHub.** Two different things people confuse:

- **Git** = the version control software itself. Created by **Linus Torvalds** in 2005. It's a command-line tool you install. Free, open source. Runs entirely on your machine.
- **GitHub** = a *website* that hosts Git repos in the cloud and adds collaboration tools (PRs, issues, code review). Owned by Microsoft. You use Git locally, then `git push` to GitHub.

Worktrees are a feature of **Git itself**, added in **Git version 2.5, July 2015**, by the Git core maintainers. GitHub had nothing to do with inventing them.

You can use worktrees in any Git repo regardless of where it's hosted (GitHub, GitLab, Bitbucket, your own server, no hosting at all).

---

## TL;DR

| Concept | What it really is |
|---|---|
| `.git/` directory | The library — the actual repo, holds all history |
| Visible files | A printout of one branch — disposable |
| `git checkout` | "Replace the printout with a different branch's files" |
| Worktree | A second printout area (folder), sharing the same library, on a different branch |

A worktree is **just another folder where your repo's history is checked out at a different branch**. That's it.

When Claude Code creates `.claude/worktrees/<name>/`, that folder is a normal folder containing a `.git` text file pointing back at your real `.git/`. Claude works there, you work in your original folder, neither steps on the other.
