# `PUBLIC_ADMIN_KEY` / `TASKMOBILE_PUBLIC_ADMIN_KEY` has been removed — action required

**Date:** 2026-07-27 · **Filed by:** hadoku_site (platform)

## What changed

The vault item `TASKMOBILE_PUBLIC_ADMIN_KEY` has been **deleted**. Your
`.devvault.json` still maps `PUBLIC_ADMIN_KEY -> TASKMOBILE_PUBLIC_ADMIN_KEY`, so
`dev-vault.mjs` will now report it missing.

This is deliberate. **Child apps are not permitted an admin-tier credential.**
An admin key grants write access to the whole platform vault and to
`mint-agent-token`. A mobile client shipping — or even building against — a
credential of that scope is not something we want to exist.

## Why you had one

A gitignore-blind search (`grep -r --no-ignore-files PUBLIC_ADMIN_KEY`) found
only a **comment** in `scripts/manage_github_token.py` describing the mapping.
No code reads it. It also never authenticated: no edge-router registry record, so
it resolved to `public` everywhere.

## What to do

1. Remove the `"PUBLIC_ADMIN_KEY": "TASKMOBILE_PUBLIC_ADMIN_KEY"` line from
   `.devvault.json`.
2. Update the stale comment in `scripts/manage_github_token.py`.
3. Re-run `node ../hadoku_site/scripts/secrets/dev-vault.mjs --check`.

`PUBLIC_FRIEND_KEY -> TASKMOBILE_PUBLIC_FRIEND_KEY` is **unaffected and stays**.
Friend-tier keys for testing are explicitly allowed.

## Heads-up: your vault caller key was also replaced

Separately, on 2026-07-27 this repo's `.devvault.local.json` held a key with no
registry record (dead since May), so every dev-vault call was failing. It has been
replaced with a freshly minted service key (`taskmobile-devvault`) and the ACL
re-synced — `dev-vault --check` now reports 13/13. No action needed; noted so the
change isn't a surprise.

## If something genuinely needs admin

It shouldn't. That operation belongs behind a platform endpoint the app calls, not
an admin credential held by the app. Raise it on hadoku_site.

---

# Update, same day: `PUBLIC_FRIEND_KEY` moved too

`TASKMOBILE_PUBLIC_FRIEND_KEY` has ALSO been deleted, and replaced by a
properly registered friend key.

**Why:** the old value had no edge-router registry record, so it resolved to
`public` — friend-tier tests would have looked authenticated while actually
exercising the public path.

**New key:** vault item `KEY_FRIEND_TASKMOBILE_E2E`, registry name
`taskmobile-e2e`, tier `friend`. Verified `{"valid":true,"userType":"friend"}`.

**What to do** — in `.devvault.json`:

```diff
-  "PUBLIC_ADMIN_KEY": "TASKMOBILE_PUBLIC_ADMIN_KEY",
-  "PUBLIC_FRIEND_KEY": "TASKMOBILE_PUBLIC_FRIEND_KEY",
+  "PUBLIC_FRIEND_KEY": "KEY_FRIEND_TASKMOBILE_E2E",
```

---

# Resolution — 2026-07-27 (hadoku-task-mobile)

Done in this repo:

- `.devvault.json`: dropped `PUBLIC_ADMIN_KEY`, repointed
  `PUBLIC_FRIEND_KEY -> KEY_FRIEND_TASKMOBILE_E2E`. Mapping is now 12 entries.
- `scripts/manage_github_token.py:178`: stale comment now cites the real mapping
  in `SECRET_CONFIGS` (`TASK_GITHUB_TOKEN -> HADOKU_SITE_TOKEN`). No code read
  the admin key; nothing else to remove.
- `dev-vault --check`: **11/12 fetchable**.

**Still blocked on the operator.** `KEY_FRIEND_TASKMOBILE_E2E` returns
`HTTP 403 access denied` — the vault item exists, but this repo's service key
isn't granted it, and the two deleted names are still in the grant list:

```
declared in .devvault.json but NOT granted: KEY_FRIEND_TASKMOBILE_E2E
granted but NOT in .devvault.json:          TASKMOBILE_PUBLIC_ADMIN_KEY,
                                            TASKMOBILE_PUBLIC_FRIEND_KEY
```

Service tier can't grant, so the ACL re-sync mentioned above didn't cover the new
friend key. Operator, please run:

```sh
python scripts/administration.py key-acl-sync \
  --repo ../hadoku-task-mobile --key <taskmobile-devvault uuid> --prune
```

`--prune` is what clears the two dead grants. After that `--check` should read
12/12 and this file can be deleted.
