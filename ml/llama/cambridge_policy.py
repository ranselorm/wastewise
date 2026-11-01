"""Small, local set of verified Cambridge disposal messages."""

from dataclasses import dataclass
@dataclass(frozen=True)
class GuidanceDecision:
    facts: tuple[str, ...]


# Facts checked 31 October 2026. Keep each rule item-specific; do not create a
# catch-all route for an entire classifier category.
RULES: dict[str, GuidanceDecision] = {
    "small_household_battery": GuidanceDecision(
        facts=(
            "Never put the battery inside a household bin.",
            "Take it to a local battery recycling point or a Household Recycling Centre.",
            "If you have your own household bin collection, small household batteries may be placed in a small tied plastic bag loosely on top of the bin lid.",
        ),
    ),
    "battery_in_device": GuidanceDecision(
        facts=(
            "Never put the device in a household bin.",
            "Take the electrical item to a Household Recycling Centre.",
        ),
    ),
    "glass_bottle_or_jar": GuidanceDecision(
        facts=(
            "Rinse the bottle or jar and replace its cap or lid.",
            "Put it loose in the blue recycling bin.",
        ),
    ),
    "drinking_glass": GuidanceDecision(
        facts=(
            "Do not put drinking glasses with glass bottles and jars in the blue bin.",
            "Carefully bag it and put it in the black bin.",
        ),
    ),
    "plastic_bottle": GuidanceDecision(
        facts=(
            "Empty, rinse and squash the bottle, then put its lid or spray trigger back on.",
            "Put it loose in the blue recycling bin.",
        ),
    ),
    "plastic_tub_pot_or_tray": GuidanceDecision(
        facts=(
            "Remove any film or bubble wrap and put an absorbent layer in the black bin.",
            "Wash the plastic, shake off excess water, and put it loose in the blue recycling bin.",
        ),
    ),
    "foam_packaging": GuidanceDecision(
        facts=("Put foam, sponge or polystyrene packaging in the black bin.",),
    ),
    "clean_dry_textile": GuidanceDecision(
        facts=(
            "Keep the item clean and dry.",
            "Take it to a clothing or textile recycling bank.",
        ),
    ),
    "wet_or_soiled_textile": GuidanceDecision(
        facts=(
            "Do not put wet, mouldy or soiled textiles in a textile recycling bank.",
            "Put the item in the black bin.",
        ),
    ),
    "clean_dry_cardboard": GuidanceDecision(
        facts=(
            "Keep the cardboard clean and dry, then break down and flatten large boxes.",
            "Put it loose in the blue recycling bin.",
        ),
    ),
    "clean_paper": GuidanceDecision(
        facts=(
            "Put clean paper, newspapers, magazines, envelopes or paper packaging loose in the blue recycling bin.",
        ),
    ),
    "soiled_or_special_paper": GuidanceDecision(
        facts=(
            "Paper with food on it, tissues, tissue paper, laminated paper, or painted and glittered craft paper cannot be recycled.",
            "Put it in the black bin.",
        ),
    ),
    "metal_food_or_drink_can": GuidanceDecision(
        facts=(
            "Rinse and crush the can.",
            "Put it loose in the blue recycling bin.",
        ),
    ),
    "scrap_metal": GuidanceDecision(
        facts=(
            "Do not put non-packaging metal such as pans, taps, coat hangers or tools in the blue bin.",
            "Take scrap metal to a Household Recycling Centre.",
        ),
    ),
    "electrical_item": GuidanceDecision(
        facts=(
            "Do not put electrical items in a household bin.",
            "Take the item to a Household Recycling Centre.",
        ),
    ),
    "organic_waste": GuidanceDecision(
        facts=(
            "If food-waste collections have started at your address, put food waste in the silver caddy.",
            "If your food-waste collection has not started, put food waste in the green bin.",
        ),
    ),
    "general_waste": GuidanceDecision(
        facts=("Put ordinary non-recyclable household waste in the black bin.",),
    ),
}

def route_for(item_key: str) -> GuidanceDecision:
    """Return one reviewed route. Unsupported items are handled by the app."""
    return RULES[item_key]
