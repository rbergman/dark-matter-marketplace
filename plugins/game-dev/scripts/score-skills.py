#!/usr/bin/env python3
"""Score dm-game skills on grounding and density.

Run from the plugin root:  python3 scripts/score-skills.py [--json]

WHAT THIS MEASURES
    words        total words in SKILL.md
    cites        named sources (Author, *Title*, GDC talks, "et al.", years)
    specs        numeric values carrying a unit or range
    tests        explicit falsifiable tests (**Test:** / **Rule:** / checklist items)
    xref         lines inside cross-reference sections
    activate     lines inside "When to Activate" sections

WHAT THIS CANNOT SEE  (state this whenever quoting the numbers)
    - Whether a citation is ACCURATE. It counts shapes, not truth.
    - Whether a spec is CORRECT. A wrong number scores the same as a right one.
    - Whether a "test" is genuinely falsifiable. Checklist boxes inflate `tests`,
      which is why the column is reported but never used as a gate on its own.
    - Prose thresholds written out in words ("three to five") score zero.
A skill that scores well here is not verified. It is merely checkable.
"""

import json
import re
import sys
from pathlib import Path

SKILLS = Path(__file__).resolve().parent.parent / "skills"

# A citation looks like one of: "Celia Hodent", "*Game Feel*", "GDC 2019",
# "Deci & Ryan", "(Cowan, 2001)", "et al."
CITE = re.compile(
    r"(GDC\s*(?:19|20)\d{2}"
    r"|\*[A-Z][^*\n]{3,60}\*\s*\("
    r"|\b[A-Z][a-z]+\s+&\s+[A-Z][a-z]+\b"
    r"|\bet al\.?"
    r"|\b[A-Z][a-z]+,\s*(?:19|20)\d{2}\b"
    r"|\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s*\*)"
)
SPEC = re.compile(
    r"(?<![#\-\d.])\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*"
    r"(?:ms\b|s\b|%|px\b|fps\b|frames?\b|words?\b|min\b|hours?\b|x\b|:\d)"
)
TEST = re.compile(r"(?im)^\s*(?:\*\*(?:test|rule|acceptance)\b|- \[ \])")


def section_lines(text: str, heading_re: str) -> int:
    """Count non-blank lines inside any section whose heading matches."""
    total = 0
    inside = False
    level = 0
    for line in text.split("\n"):
        m = re.match(r"^(#{2,4})\s+(.*)$", line)
        if m:
            if inside and len(m.group(1)) <= level:
                inside = False
            if re.search(heading_re, m.group(2), re.I):
                inside, level = True, len(m.group(1))
                continue
        if inside and line.strip() and line.strip() != "---":
            total += 1
    return total


def score(path: Path) -> dict:
    text = path.read_text()
    body = re.sub(r"^---\n.*?\n---\n", "", text, flags=re.S)
    return {
        "skill": path.parent.name,
        "words": len(body.split()),
        "cites": len(CITE.findall(body)),
        "specs": len(SPEC.findall(body)),
        "tests": len(TEST.findall(body)),
        "xref": section_lines(body, r"cross[- ]reference|related skills"),
        "activate": section_lines(body, r"when to (activate|use)"),
    }


def main() -> int:
    rows = sorted(
        (score(p) for p in SKILLS.glob("*/SKILL.md")),
        key=lambda r: -r["words"],
    )
    if "--json" in sys.argv:
        print(json.dumps(rows, indent=2))
        return 0

    cols = ["words", "cites", "specs", "tests", "xref", "activate"]
    print(f"{'skill':28}" + "".join(f"{c:>9}" for c in cols))
    print("-" * (28 + 9 * len(cols)))
    for r in rows:
        print(f"{r['skill']:28}" + "".join(f"{r[c]:>9}" for c in cols))
    print("-" * (28 + 9 * len(cols)))
    tot = {c: sum(r[c] for r in rows) for c in cols}
    print(f"{f'TOTAL ({len(rows)} skills)':28}" + "".join(f"{tot[c]:>9}" for c in cols))
    print(f"\nskills with 0 citations: {sum(1 for r in rows if not r['cites'])}")
    print(f"skills with 0 specs:     {sum(1 for r in rows if not r['specs'])}")
    print("\nBlind spots: counts shapes, not truth. A wrong number and a right")
    print("number score alike; checklist boxes inflate `tests`.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
