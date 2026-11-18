"""Simple app-level guard before Llama is called."""

from cambridge_policy import GuidanceDecision, route_for
from policy_renderer import render


SUPPORTED_CLASSIFIER_CATEGORIES = frozenset({
    "battery",
    "general_waste",
    "glass",
    "metal",
    "organic_waste",
    "paper_cardboard",
    "plastic",
    "textile",
})

CATEGORY_ROUTES = {
    "battery": "small_household_battery",
    "general_waste": "general_waste",
    "glass": "glass_bottle_or_jar",
    "metal": "metal_food_or_drink_can",
    "organic_waste": "organic_waste",
    "paper_cardboard": "clean_dry_cardboard",
    "plastic": "plastic_bottle",
    "textile": "clean_dry_textile",
}

RETAKE_MESSAGE = "Please retake the photo so I can identify the item clearly."


def policy_for_photo(
    category: str,
    confidence: float,
) -> GuidanceDecision | None:
    """Return verified facts for Llama, or None when the app should retake."""
    normalised_category = category.strip().lower()
    if confidence < 0.60 or normalised_category not in SUPPORTED_CLASSIFIER_CATEGORIES:
        return None
    return route_for(CATEGORY_ROUTES[normalised_category])


def guidance_for_photo(category: str, confidence: float) -> str:
    """Deterministic fallback text; Llama's app integration comes later."""
    decision = policy_for_photo(category, confidence)
    return RETAKE_MESSAGE if decision is None else render(decision)
