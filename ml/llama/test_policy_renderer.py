from cambridge_policy import route_for
from policy_renderer import render


def test_renderer_preserves_every_selected_fact() -> None:
    decision = route_for("small_household_battery")
    text = render(decision)
    for fact in decision.facts:
        assert fact in text


if __name__ == "__main__":
    test_renderer_preserves_every_selected_fact()
    print("Renderer checks passed")
