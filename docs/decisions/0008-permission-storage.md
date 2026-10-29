# 0008 Permission: storage

Status: accepted.

**Why:** the service worker can be stopped after 30 seconds idle and loses its globals. Per-tab cover state goes in `storage.session`, and settings (enabled types, the list of sites with automatic cover) go in `storage.local`.

**What may be stored:** booleans, type switches, hostnames and counts. Detected values are never stored.

**Quota:** 10 MB each, far above what is needed, so `unlimitedStorage` is not requested.
