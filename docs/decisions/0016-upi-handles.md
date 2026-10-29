# 0016 UPI handles and telling a UPI ID from an email address

Status: accepted, with a verification caveat (see below).

**Why:** a UPI ID (`name@handle`) looks like an email address with the domain cut off. Without a handle list, every `word@word` in a chat transcript or code comment would be covered.

## Rule

- A UPI ID is a local part of 2 to 64 characters from `A-Z a-z 0-9 . _ -` (starting with a letter or digit), then `@`, then a handle from the configured list. Matching is case-insensitive.
- The handle must end the name: a following letter, digit or underscore rejects it, and so does a dot or hyphen followed by more name. `asha@paytm.com` is therefore an email address, not a UPI ID, and `asha@paytm` is a UPI ID.
- The list is a parameter of `createUpiDetector`. `detectUpi` uses `DEFAULT_UPI_HANDLES`.
- Email detection needs a dot in the domain, so the two detectors cannot both claim the same text. If they ever overlap, the merge step prefers UPI (decision 0018).

## Verification status

I could not verify the list against NPCI. NPCI's member page (`npci.org.in/product/upi/all-members`) lists banks and apps but not handles, and I found no NPCI document that lists handles. The default list is tiered by what I could corroborate:

1. **Confirmed by two independent secondary sources** (a Razorpay guide and a handle table on toolsarena.in): `okaxis`, `okicici`, `okhdfcbank`, `oksbi`, `ybl`, `ibl`, `axl`, `apl`, `upi`, `kotak`.
2. **Confirmed by NPCI:** `paytm`, through the NPCI press release approving One97 Communications as a third-party app provider, which names the `@paytm` handle.
3. **Single secondary source** (toolsarena.in only): `icici`, `hdfcbank`, `sbi`, `axisbank`, `yesbank`, `yesbankltd`, `fbl`, `federal`, `idfcbank`, `idbi`, `kvb`, `dbs`, `dlb`, `esaf`, `jkb`, `kbl`, `lvb`, `mahb`, `nsdl`, `pnb`, `airtel`, `psb`, `bob`, `rbl`, `boi`, `saraswat`, `cbi`, `scb`, `citi`, `sib`, `cnrb`, `tjsb`, `corporation`, `ubi`, `dena`, `ucb`, `equitas`, `fino`, `vijb`, `hsbc`, `ikwik`.

The two sources disagree on which bank sponsors `ibl`, so the bank mapping is not used anywhere. Handles change as banks merge and apps are added; a UPI ID with a handle not in the list is missed, not wrongly matched.

## Consequences

- Misses: any handle not in the list. The list is the one place to extend.
- False positives: `word@handle` text that is not a payment address, for example `meet@sbi` in prose. The list keeps this rare; tests record it.
- Confidence is 0.85 for every match.
