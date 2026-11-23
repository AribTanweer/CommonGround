from rest_framework import serializers
from apps.accounts.serializers import UserSummarySerializer
from .models import Comment, Vote, Report


class CommentReplySerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id", "author", "author_username", "parent", "body", "created_at"
        )
        read_only_fields = ("id", "author", "created_at")


class CommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id", "author", "author_username", "challenge", "solution",
            "parent", "body", "created_at", "replies"
        )
        read_only_fields = ("id", "author", "challenge", "solution", "created_at")

    def get_replies(self, obj):
        # Only nest one level of replies or recursive
        replies = obj.replies.all().select_related("author")
        return CommentReplySerializer(replies, many=True).data


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("id", "parent", "body")
        read_only_fields = ("id",)


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)

    class Meta:
        model = Report
        fields = (
            "id", "reporter", "reporter_username", "challenge", "solution",
            "comment", "reason", "created_at", "resolved"
        )
        read_only_fields = ("id", "reporter", "created_at", "resolved")

    def validate(self, attrs):
        targets = [attrs.get("challenge"), attrs.get("solution"), attrs.get("comment")]
        set_count = sum(1 for t in targets if t is not None)
        if set_count != 1:
            raise serializers.ValidationError(
                "Exactly one target (challenge, solution, or comment) must be specified."
            )
        return attrs
