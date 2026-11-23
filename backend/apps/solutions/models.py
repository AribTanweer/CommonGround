from django.db import models
from django.conf import settings


class Solution(models.Model):
    class EffortLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "med", "Medium"
        HIGH = "high", "High"

    challenge = models.ForeignKey(
        "challenges.Challenge", on_delete=models.CASCADE, related_name="solutions"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="solutions"
    )
    title = models.CharField(max_length=200)
    summary = models.TextField()
    estimated_cost = models.CharField(max_length=80, blank=True)
    effort_level = models.CharField(
        max_length=10, choices=EffortLevel.choices, default=EffortLevel.MEDIUM
    )
    score = models.IntegerField(default=0)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["challenge"],
                condition=models.Q(is_accepted=True),
                name="one_accepted_per_challenge",
            )
        ]

    def __str__(self):
        return self.title


class SolutionRevision(models.Model):
    solution = models.ForeignKey(
        Solution, on_delete=models.CASCADE, related_name="revisions"
    )
    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    content = models.TextField()
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Revision of {self.solution} by {self.editor}"
