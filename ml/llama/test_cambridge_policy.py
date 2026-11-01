"""Fast local checks for the policy decision layer; no model is loaded."""

from cambridge_policy import route_for


def test_battery_is_never_an_in_bin_rule() -> None:
    result = route_for("small_household_battery")
    assert "Never put" in result.facts[0]
    assert "inside" in result.facts[0]


def test_glass_bottle_and_drinking_glass_differ() -> None:
    bottle = route_for("glass_bottle_or_jar")
    drinking_glass = route_for("drinking_glass")
    assert "blue recycling bin" in " ".join(bottle.facts)
    assert "black bin" in " ".join(drinking_glass.facts)


def test_metal_packaging_and_scrap_differ() -> None:
    can = route_for("metal_food_or_drink_can")
    scrap = route_for("scrap_metal")
    assert "blue recycling bin" in " ".join(can.facts)
    assert "Household Recycling Centre" in " ".join(scrap.facts)


if __name__ == "__main__":
    test_battery_is_never_an_in_bin_rule()
    test_glass_bottle_and_drinking_glass_differ()
    test_metal_packaging_and_scrap_differ()
    print("Policy checks passed")
