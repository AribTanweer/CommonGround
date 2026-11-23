from django.db import models
from django.conf import settings


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="actor_notifications",
    )
    verb = models.CharField(max_length=255)
    target_type = models.CharField(max_length=50)  # "challenge", "solution", "comment"
    target_id = models.PositiveIntegerField()
    challenge = models.ForeignKey(
        "challenges.Challenge",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification to {self.recipient}: {self.actor} {self.verb} ({self.target_type} #{self.target_id})"
