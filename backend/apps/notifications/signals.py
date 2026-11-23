from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.solutions.models import Solution
from apps.engagement.models import Comment, Vote
from apps.challenges.models import Follow
from .models import Notification


@receiver(post_save, sender=Solution)
def on_solution_created(sender, instance, created, **kwargs):
    if not created:
        return

    challenge = instance.challenge
    # Notify challenge author if not the same
    if challenge.author != instance.author:
        Notification.objects.create(
            recipient=challenge.author,
            actor=instance.author,
            verb="proposed a solution for",
            target_type="solution",
            target_id=instance.pk,
            challenge=challenge,
        )

    # Notify followers
    followers = Follow.objects.filter(challenge=challenge).exclude(
        user__in=[instance.author, challenge.author]
    )
    for f in followers:
        Notification.objects.create(
            recipient=f.user,
            actor=instance.author,
            verb="proposed a new solution on followed challenge",
            target_type="solution",
            target_id=instance.pk,
            challenge=challenge,
        )


@receiver(post_save, sender=Comment)
def on_comment_created(sender, instance, created, **kwargs):
    if not created:
        return

    # 1. If reply to a comment
    if instance.parent and instance.parent.author != instance.author:
        challenge = instance.challenge or (instance.solution.challenge if instance.solution else None)
        Notification.objects.create(
            recipient=instance.parent.author,
            actor=instance.author,
            verb="replied to your comment on",
            target_type="comment",
            target_id=instance.pk,
            challenge=challenge,
        )

    # 2. If comment on challenge
    if instance.challenge and instance.challenge.author != instance.author:
        Notification.objects.create(
            recipient=instance.challenge.author,
            actor=instance.author,
            verb="commented on your challenge",
            target_type="challenge",
            target_id=instance.challenge.pk,
            challenge=instance.challenge,
        )

    # 3. If comment on solution
    if instance.solution and instance.solution.author != instance.author:
        Notification.objects.create(
            recipient=instance.solution.author,
            actor=instance.author,
            verb="commented on your solution for",
            target_type="solution",
            target_id=instance.solution.pk,
            challenge=instance.solution.challenge,
        )


@receiver(post_save, sender=Vote)
def on_vote_created(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.challenge and instance.challenge.author != instance.user:
        Notification.objects.create(
            recipient=instance.challenge.author,
            actor=instance.user,
            verb="supported your challenge",
            target_type="challenge",
            target_id=instance.challenge.pk,
            challenge=instance.challenge,
        )

    if instance.solution and instance.solution.author != instance.user:
        Notification.objects.create(
            recipient=instance.solution.author,
            actor=instance.user,
            verb="voted on your solution for",
            target_type="solution",
            target_id=instance.solution.pk,
            challenge=instance.solution.challenge,
        )
