from django.db.models import Q


def can_view_challenge(user, challenge):
    space = challenge.space
    if space is None or not space.is_private:
        return True
    if not getattr(user, "is_authenticated", False):
        return False
    return space.creator_id == user.id or space.memberships.filter(user=user).exists()


def visible_challenges(user):
    from .models import Challenge
    if not getattr(user, "is_authenticated", False):
        return Challenge.objects.filter(Q(space__isnull=True) | Q(space__is_private=False))
    return Challenge.objects.filter(
        Q(space__isnull=True) | Q(space__is_private=False) | Q(space__creator=user) | Q(space__memberships__user=user)
    ).distinct()
