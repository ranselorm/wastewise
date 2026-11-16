"""Build the short, fact-bound prompt used after app-level classification."""

from cambridge_policy import GuidanceDecision


SYSTEM_MESSAGE = (
    "You are Wastewise, a friendly Cambridge recycling assistant. "
    "Return one numbered line for every supplied fact. "
    "Do not add, remove or change any disposal instruction."
)


def build_prompt(decision: GuidanceDecision) -> str:
    facts = "\n".join(f"- {fact}" for fact in decision.facts)
    return f"{SYSTEM_MESSAGE}\n\nVerified facts:\n{facts}\n\nGuidance:"
