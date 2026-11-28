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
    responsible_party = models.CharField(max_length=120, blank=True)
    target_date = models.DateField(null=True, blank=True)
    outcome_notes = models.TextField(blank=True)
    actual_cost = models.CharField(max_length=80, blank=True)
    duration_days = models.PositiveIntegerField(null=True, blank=True)
    outcome_evidence_url = models.URLField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
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


class SolutionMilestone(models.Model):
    solution = models.ForeignKey(Solution, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=160)
    due_date = models.DateField(null=True, blank=True)
    is_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="solution_milestones")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["is_complete", "due_date", "created_at"]


class VolunteerSignup(models.Model):
    solution = models.ForeignKey(Solution, on_delete=models.CASCADE, related_name="volunteers")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="volunteer_signups")
    contribution = models.CharField(max_length=160)
    note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [models.UniqueConstraint(fields=["solution", "user"], name="unique_solution_volunteer")]


class ResourceOffer(models.Model):
    solution = models.ForeignKey(Solution, on_delete=models.CASCADE, related_name="resource_offers")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resource_offers")
    resource = models.CharField(max_length=160)
    details = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class SolutionQuestion(models.Model):
    solution = models.ForeignKey(Solution, on_delete=models.CASCADE, related_name="questions")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="solution_questions")
    question = models.CharField(max_length=500)
    answer = models.TextField(blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
