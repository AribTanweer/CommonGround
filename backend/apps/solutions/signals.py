"""Signals for solutions — auto-transition challenge status."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Solution


@receiver(post_save, sender=Solution)
def solution_created_handler(sender, instance, created, **kwargs):
    """First solution moves challenge from open to proposed."""
    if created:
        challenge = instance.challenge
        if challenge.status == "open":
            challenge.status = "proposed"
            challenge.save(update_fields=["status"])
