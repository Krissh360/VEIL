# 0015 Payment card issuer prefixes and lengths

Status: accepted, with a verification caveat (see below).

**Why:** a Luhn check alone passes one random digit string in ten. Requiring a plausible issuer prefix and length removes most of the rest, so order numbers, tracking numbers and timestamps are rarely covered.

## Rule

A card number is 13 to 19 ASCII digits, bare or in groups with one consistent separator in the layout for its length (13: 4-4-4-1, 14: 4-6-4, 15: 4-6-5, 16: 4-4-4-4, 17 to 19: 4-4-4-4 plus the remainder). It must pass the Luhn check, and its prefix and length must match one of these issuers:

| Issuer      | Prefixes                                              | Lengths |
| ----------- | ----------------------------------------------------- | ------- |
| Visa        | 4                                                     | 13, 16, 19 |
| Mastercard  | 51 to 55, 2221 to 2720                                | 16      |
| American Express | 34, 37                                           | 15      |
| Discover    | 6011, 644 to 649, 65                                  | 16 to 19 |
| Diners Club | 30, 36, 38, 39                                        | 14 to 19 |
| JCB         | 3528 to 3589                                          | 16 to 19 |
| UnionPay    | 62                                                    | 16 to 19 |
| RuPay       | 60, 81, 82, 508 (65 is covered by Discover)           | 16      |
| Maestro     | 5018, 5020, 5038, 5893, 6304, 6759, 6761 to 6763      | 13 to 19 |
| Mir         | 2200 to 2204                                          | 16 to 19 |

## Source and caveats

The table follows the issuer identification number list in Wikipedia's "Payment card number" article, which says allocation follows ISO/IEC 7812 and the ISO register kept by the American Bankers Association. The article is tagged as needing more citations. I did not check the ISO register itself, which is not freely readable.

Left out on purpose:

- UATP (prefix 1, 15 digits), because it would admit many ordinary 15-digit numbers.
- Visa Electron and Diners enRoute, which are not Luhn-checked.
- Maestro numbers of 12 digits, because 13 is the shortest length scanned.
- Verve, which is outside the cards this tool is aimed at.

New or rare issuer ranges are therefore missed (never wrongly matched). Co-branded RuPay-JCB cards (353, 356) fall in the JCB range.

## Consequences

- Grouped numbers match at confidence 0.95, bare runs at 0.8.
- Because there is one pattern per layout, a card followed by its expiry date (`4111 1111 1111 1111 12/25`) still matches at its own length.
- Boundary rules follow decision 0013.
