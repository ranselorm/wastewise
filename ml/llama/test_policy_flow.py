from policy_flow import CATEGORY_ROUTES, RETAKE_MESSAGE, SUPPORTED_CLASSIFIER_CATEGORIES, guidance_for_photo, policy_for_photo


def test_every_classifier_category_has_a_saved_route() -> None:
    assert set(CATEGORY_ROUTES) == SUPPORTED_CLASSIFIER_CATEGORIES


def test_low_confidence_never_shows_a_disposal_route() -> None:
    assert guidance_for_photo("plastic", 0.42) == RETAKE_MESSAGE


def test_selected_item_shows_one_verified_answer() -> None:
    message = guidance_for_photo("plastic", 0.89)
    assert "1. Empty, rinse and squash" in message
    assert "2. Put it loose in the blue recycling bin." in message


def test_high_confidence_photo_supplies_facts_for_llama() -> None:
    decision = policy_for_photo("battery", 0.88)
    assert decision is not None
    assert "Never put" in decision.facts[0]


def test_low_confidence_photo_never_reaches_llama() -> None:
    assert policy_for_photo("battery", 0.42) is None


def test_unknown_category_does_not_guess() -> None:
    assert guidance_for_photo("wood", 0.99) == RETAKE_MESSAGE


if __name__ == "__main__":
    test_every_classifier_category_has_a_saved_route()
    test_low_confidence_never_shows_a_disposal_route()
    test_selected_item_shows_one_verified_answer()
    test_high_confidence_photo_supplies_facts_for_llama()
    test_low_confidence_photo_never_reaches_llama()
    test_unknown_category_does_not_guess()
    print("Policy-flow checks passed")
