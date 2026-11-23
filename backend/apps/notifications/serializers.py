from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
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
    ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )

