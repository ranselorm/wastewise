"""Deterministic user-facing text for a selected local policy decision.

The displayed disposal instruction is always built from the verified fact pack.
Llama may be tested as an optional wording assistant, but it cannot replace
this renderer until it passes a larger independent preservation test.
"""

from cambridge_policy import GuidanceDecision


def render(decision: GuidanceDecision) -> str:
    return "\n".join(
        f"{number}. {fact}" for number, fact in enumerate(decision.facts, start=1)
    )
