"""Signals for solutions — auto-transition challenge status."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Solution
from apps.challenges.models import ChallengeUpdate


@receiver(post_save, sender=Solution)
def solution_created_handler(sender, instance, created, **kwargs):
    """First solution moves challenge from open to proposed."""
    if created:
        challenge = instance.challenge
        if challenge.status == "open":
            challenge.status = "proposed"
            challenge.save(update_fields=["status"])
            ChallengeUpdate.objects.create(
                challenge=challenge,
                author=instance.author,
                body=f"Proposed a solution: {instance.title}",
                status=challenge.status,
            )
