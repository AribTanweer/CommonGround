from rest_framework import serializers
from apps.accounts.serializers import UserSummarySerializer
from .models import Solution, SolutionRevision, SolutionMilestone, VolunteerSignup, ResourceOffer, SolutionQuestion


class SolutionRevisionSerializer(serializers.ModelSerializer):
    editor = UserSummarySerializer(read_only=True)
    editor_username = serializers.CharField(source="editor.username", read_only=True)

    class Meta:
        model = SolutionRevision
        fields = ("id", "editor", "editor_username", "content", "note", "created_at")
        read_only_fields = ("id", "editor", "created_at")


class SolutionListSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    challenge_title = serializers.CharField(source="challenge.title", read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Solution
        fields = (
            "id", "challenge", "challenge_title", "author", "author_username",
            "title", "summary", "estimated_cost", "effort_level",
            "score", "is_accepted", "user_vote", "created_at", "responsible_party", "target_date",
            "outcome_notes", "actual_cost", "duration_days", "outcome_evidence_url", "completed_at",
        )
        read_only_fields = ("id", "author", "challenge", "score", "is_accepted", "created_at")

    def get_user_vote(self, obj) -> int:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.engagement.models import Vote
            vote = Vote.objects.filter(user=request.user, solution=obj).first()
            return vote.value if vote else 0
        return 0


class SolutionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solution
        fields = ("id", "title", "summary", "estimated_cost", "effort_level")
        read_only_fields = ("id",)


class SolutionDetailSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    challenge_title = serializers.CharField(source="challenge.title", read_only=True)
    revisions = SolutionRevisionSerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Solution
        fields = (
            "id", "challenge", "challenge_title", "author", "author_username",
            "title", "summary", "estimated_cost", "effort_level",
            "score", "is_accepted", "user_vote", "created_at", "revisions", "responsible_party", "target_date",
            "outcome_notes", "actual_cost", "duration_days", "outcome_evidence_url", "completed_at",
        )
        read_only_fields = (
            "id", "author", "challenge", "score", "is_accepted", "created_at",
            "responsible_party", "target_date", "outcome_notes", "actual_cost",
            "duration_days", "outcome_evidence_url", "completed_at",
        )

    def get_user_vote(self, obj) -> int:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.engagement.models import Vote
            vote = Vote.objects.filter(user=request.user, solution=obj).first()
            return vote.value if vote else 0
        return 0


class SolutionVoteInputSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=[(1, "1"), (-1, "-1")], default=1)


class SolutionMilestoneSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = SolutionMilestone
        fields = ("id", "title", "due_date", "is_complete", "completed_at", "created_by", "created_at")
        read_only_fields = ("id", "completed_at", "created_by", "created_at")


class VolunteerSignupSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = VolunteerSignup
        fields = ("id", "user", "contribution", "note", "created_at")
        read_only_fields = ("id", "user", "created_at")


class ResourceOfferSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = ResourceOffer
        fields = ("id", "user", "resource", "details", "created_at")
        read_only_fields = ("id", "user", "created_at")


class SolutionQuestionSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = SolutionQuestion
        fields = ("id", "author", "question", "answer", "answered_at", "created_at")
        read_only_fields = ("id", "author", "answered_at", "created_at")


class SolutionQuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolutionQuestion
        fields = ("answer",)


class SolutionOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solution
        fields = ("outcome_notes", "actual_cost", "duration_days", "outcome_evidence_url")


class SolutionProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solution
        fields = ("responsible_party", "target_date")

