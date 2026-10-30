# 0017 Secret and token formats

Status: accepted, with the verification limits below.

**Why:** secrets have no checksum we can use, so each rule leans on a distinctive prefix and a minimum length. The generic rule is deliberately narrow because a loose one would cover ordinary identifiers.

## Rules

| Rule | Pattern | Confidence |
| ---- | ------- | ---------- |
| AWS access key ID | `AKIA`, `ASIA`, `ABIA` or `ACCA` followed by 16 capitals or digits (20 characters) | 0.95 |
| GitHub token | `ghp_`, `gho_`, `ghu_` or `ghr_` followed by 36 to 255 letters or digits; `ghs_` followed by 36 to 1024 letters, digits, `.`, `-` or `_` (not ending in a dot); `github_pat_` followed by 40 to 255 letters, digits or underscores | 0.98 |
| Slack token | `xoxa-`, `xoxb-`, `xoxp-`, `xoxr-`, `xoxs-` or `xapp-` followed by 20 to 250 letters, digits or hyphens | 0.95 |
| JWT | `eyJ` header, a dot, an `eyJ` payload, a dot, a signature that may be empty; each part is base64url and length-capped (2048, 8192, 2048) | 0.9 |
| Generic | a value of 20 to 512 characters after `api_key`, `secret`, `secret_key`, `client_secret`, `access_token`, `auth_token`, `refresh_token`, `bearer_token`, `private_key`, `passwd`, `password`, `pwd` or `token` and a `:` or `=` (quotes allowed). It needs a letter, a digit and at least 3.5 bits of Shannon entropy per character. Only the value is covered. | 0.5 |

All rules use the run-boundary rule of decision 0013, extended so a token cannot start directly after a hyphen or underscore.

## What was verified, and against what

- **AWS:** the IAM identifiers page (`docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html`) lists the prefixes ABIA, ACCA, AGPA, AIDA, AIPA, AKIA, ANPA, ANVA, APKA, AROA, ASCA, ASIA. Only AKIA (access key), ASIA (temporary access key), ABIA (STS bearer token) and ACCA (context-specific credential) are credentials; the rest identify users, groups, roles and policies and are not secrets, so they are not matched. The page does not state the length or alphabet of the part after the prefix. The 20-character total and the 16-character `A-Z0-9` body come from common knowledge and are not confirmed by that page.
- **GitHub:** the authentication docs list the prefixes `ghp_`, `github_pat_`, `gho_`, `ghu_`, `ghs_`, `ghr_`. GitHub's engineering post on token formats describes base62 characters with a 6-character checksum, which implies 36 characters after a 4-character prefix; the post does not state the figure, and GitHub has said `ghs_` tokens may change format. The lower bound of 36 and upper bound of 255 are therefore an inference with room to grow. GitHub's installation-token notice (the stateless `ghs_<app id>_<JWT>` format, rolled out from April 2026) says validators should accept `ghs_[A-Za-z0-9.\-_]{36,}` and that storage should allow at least 520 characters. `ghs_` therefore takes dots, hyphens and underscores and a cap of 1024, which leaves room above 520; a trailing dot is left out so a sentence ending in a token does not swallow its full stop. The other token types keep the stricter alphabet. The `github_pat_` lengths are not documented in anything I read; the 40 to 255 range is a loose guess.
- **Slack:** the token docs (`docs.slack.dev/authentication/tokens`) list `xoxb-`, `xoxp-`, `xapp-` and note that tokens are hyphen-separated sections ending in a secret (32 characters in their example). They do not mention `xoxa-`, `xoxr-` or `xoxs-`; those are included from older token formats and are unconfirmed. The 20-to-250 length bound is a safety margin, not a documented figure.
- **JWT:** RFC 7519 defines the three dot-separated base64url parts. The `eyJ` start is the base64url encoding of `{"`, which every JWT header and, in practice, payload begins with. A JWT whose payload is not a JSON object is missed.

## Consequences

- A format that changes length is missed, not wrongly matched. Anything shorter than the minimums above is missed, including the short Slack secrets of tokens issued before August 2016.
- The generic rule misses short passwords by design. It can match a long random-looking value that is not a secret, such as a cache key assigned to a variable called `token`.
- Over-long JWTs (parts beyond the caps) are missed. The caps bound the work of each scan.
