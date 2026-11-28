from rest_framework import serializers
from apps.accounts.serializers import UserSummarySerializer
from apps.challenges.models import Challenge
from .models import Notification


class NotificationChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ("id", "title", "slug")
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    challenge = NotificationChallengeSerializer(read_only=True)
    challenge_title = serializers.CharField(source="challenge.title", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = (
            "id", "recipient", "actor", "actor_username", "verb",
            "target_type", "target_id", "challenge", "challenge_title",
            "is_read", "created_at"
        )
        read_only_fields = fields


class MarkReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )


class UnreadCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField()

