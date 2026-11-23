from django.db import models
from django.conf import settings


class Comment(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    challenge = models.ForeignKey(
        "challenges.Challenge",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    solution = models.ForeignKey(
        "solutions.Solution",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    (models.Q(challenge__isnull=False) & models.Q(solution__isnull=True))
                    | (models.Q(challenge__isnull=True) & models.Q(solution__isnull=False))
                ),
                name="comment_target_exactly_one",
            )
        ]

    def __str__(self):
        target = f"challenge {self.challenge_id}" if self.challenge_id else f"solution {self.solution_id}"
        return f"Comment by {self.author} on {target}"


class Vote(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votes"
    )
    challenge = models.ForeignKey(
        "challenges.Challenge",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    solution = models.ForeignKey(
        "solutions.Solution",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    value = models.SmallIntegerField(default=1)  # +1 or -1

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    (models.Q(challenge__isnull=False) & models.Q(solution__isnull=True))
                    | (models.Q(challenge__isnull=True) & models.Q(solution__isnull=False))
                ),
                name="vote_target_exactly_one",
            ),
            models.UniqueConstraint(
                fields=["user", "challenge"],
                name="one_vote_per_challenge",
                condition=models.Q(challenge__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["user", "solution"],
                name="one_vote_per_solution",
                condition=models.Q(solution__isnull=False),
            ),
        ]

    def __str__(self):
        target = f"challenge {self.challenge_id}" if self.challenge_id else f"solution {self.solution_id}"
        return f"Vote({self.value}) by {self.user} on {target}"


class Report(models.Model):
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    challenge = models.ForeignKey(
        "challenges.Challenge",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    solution = models.ForeignKey(
        "solutions.Solution",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    comment = models.ForeignKey(
        Comment,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    (models.Q(challenge__isnull=False) & models.Q(solution__isnull=True) & models.Q(comment__isnull=True))
                    | (models.Q(challenge__isnull=True) & models.Q(solution__isnull=False) & models.Q(comment__isnull=True))
                    | (models.Q(challenge__isnull=True) & models.Q(solution__isnull=True) & models.Q(comment__isnull=False))
                ),
                name="report_target_exactly_one",
            )
        ]

    def __str__(self):
        return f"Report by {self.reporter} (Resolved: {self.resolved})"
