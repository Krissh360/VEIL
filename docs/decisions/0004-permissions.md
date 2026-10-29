# 0004 Permissions: overview

Status: accepted. One record per permission follows.

The manifest declares `activeTab`, `scripting`, `storage` and optional host access for `http://*/*` and `https://*/*`. It declares no `host_permissions`, no static `content_scripts`, no `tabs`, no `webNavigation` and no `unlimitedStorage`. `npm run check:bundle` fails if this set changes.

| Record                                                | Permission                      | First used in            |
| ----------------------------------------------------- | ------------------------------- | ------------------------ |
| [0006](0006-permission-activetab.md)                  | `activeTab`                     | Extension wiring         |
| [0007](0007-permission-scripting.md)                  | `scripting`                     | Extension wiring         |
| [0008](0008-permission-storage.md)                    | `storage`                       | Extension wiring         |
| [0009](0009-permission-optional-host-permissions.md)  | `optional_host_permissions`     | Extension wiring         |

All four are declared now so the manifest can be reviewed once, but nothing calls them yet.

Minimum Chrome version is 119: `matchOriginAsFallback` for `about:blank`, `data:` and `blob:` frames needs it, and the Custom Highlight API has been available since 105.

Hostnames the user turns "Cover automatically" on for are persisted. Detected values never are.
