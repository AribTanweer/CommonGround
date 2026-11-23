"""Signals for challenges — e.g., auto-follow on create."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Challenge, Follow


@receiver(post_save, sender=Challenge)
def auto_follow_on_create(sender, instance, created, **kwargs):
    """Challenge author automatically follows their own challenge."""
    if created:
        Follow.objects.get_or_create(user=instance.author, challenge=instance)
