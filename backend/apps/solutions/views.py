from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils import timezone
from django.db.models import Q

from apps.core.permissions import IsOwnerOrReadOnly
from apps.challenges.models import Challenge, ChallengeUpdate, Follow
from apps.challenges.space_access import visible_challenges
from .models import Solution, SolutionRevision, SolutionMilestone, VolunteerSignup, ResourceOffer, SolutionQuestion
from .serializers import (
    SolutionListSerializer, SolutionCreateSerializer,
    SolutionDetailSerializer, SolutionRevisionSerializer,
    SolutionVoteInputSerializer,
    SolutionMilestoneSerializer, VolunteerSignupSerializer, ResourceOfferSerializer,
    SolutionQuestionSerializer, SolutionOutcomeSerializer,
    SolutionProgressSerializer,
    SolutionQuestionAnswerSerializer,
)


def can_manage_solution(user, solution):
    return user.is_authenticated and user in (solution.author, solution.challenge.author)


def visible_solutions(user):
    return Solution.objects.filter(challenge__in=visible_challenges(user))


class SolutionMilestoneListCreateView(generics.ListCreateAPIView):
    serializer_class = SolutionMilestoneSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = SolutionMilestone.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SolutionMilestone.objects.none()
        return SolutionMilestone.objects.filter(solution__in=visible_solutions(self.request.user), solution_id=self.kwargs["pk"]).select_related("created_by")

    def perform_create(self, serializer):
        solution = get_object_or_404(visible_solutions(self.request.user), pk=self.kwargs["pk"], is_accepted=True)
        if not can_manage_solution(self.request.user, solution):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner and solution lead can manage milestones.")
        serializer.save(solution=solution, created_by=self.request.user)


class SolutionMilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SolutionMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SolutionMilestone.objects.none()
        return SolutionMilestone.objects.filter(solution__in=visible_solutions(self.request.user)).select_related("solution__challenge", "solution__author")

    def perform_update(self, serializer):
        milestone = self.get_object()
        if not can_manage_solution(self.request.user, milestone.solution):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner and solution lead can manage milestones.")
        complete = serializer.validated_data.get("is_complete", milestone.is_complete)
        serializer.save(completed_at=timezone.now() if complete else None)

    def perform_destroy(self, instance):
        if not can_manage_solution(self.request.user, instance.solution):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner and solution lead can manage milestones.")
        instance.delete()


class SolutionParticipationListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    model = None
    serializer_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.model.objects.none()
        return self.model.objects.filter(solution__in=visible_solutions(self.request.user), solution_id=self.kwargs["pk"]).select_related("user")

    def perform_create(self, serializer):
        solution = get_object_or_404(visible_solutions(self.request.user), pk=self.kwargs["pk"], is_accepted=True)
        if not self.request.user.is_email_verified:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Verify your email before joining solution coordination.")
        if self.model is VolunteerSignup:
            signup, created = VolunteerSignup.objects.get_or_create(
                solution=solution,
                user=self.request.user,
                defaults={
                    "contribution": serializer.validated_data["contribution"],
                    "note": serializer.validated_data.get("note", ""),
                },
            )
            if not created:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"detail": "You have already signed up for this solution."})
            serializer.instance = signup
            return
        serializer.save(solution=solution, user=self.request.user)


class VolunteerListCreateView(SolutionParticipationListCreateView):
    model = VolunteerSignup
    serializer_class = VolunteerSignupSerializer


class ResourceOfferListCreateView(SolutionParticipationListCreateView):
    model = ResourceOffer
    serializer_class = ResourceOfferSerializer


class UserParticipationDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    model = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.model.objects.none()
        return self.model.objects.filter(user=self.request.user, solution__in=visible_solutions(self.request.user))


class VolunteerWithdrawView(UserParticipationDeleteView):
    model = VolunteerSignup
    serializer_class = VolunteerSignupSerializer


class ResourceOfferRetractView(UserParticipationDeleteView):
    model = ResourceOffer
    serializer_class = ResourceOfferSerializer


class SolutionQuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = SolutionQuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = SolutionQuestion.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SolutionQuestion.objects.none()
        return SolutionQuestion.objects.filter(solution__in=visible_solutions(self.request.user), solution_id=self.kwargs["pk"]).select_related("author")

    def perform_create(self, serializer):
        solution = get_object_or_404(visible_solutions(self.request.user), pk=self.kwargs["pk"])
        if not self.request.user.is_email_verified:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Verify your email before asking a structured question.")
        serializer.save(solution=solution, author=self.request.user)


class SolutionQuestionAnswerView(generics.UpdateAPIView):
    serializer_class = SolutionQuestionAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SolutionQuestion.objects.none()
        return SolutionQuestion.objects.filter(solution__in=visible_solutions(self.request.user)).select_related("solution__author")

    def get_object(self):
        obj = super().get_object()
        if obj.solution.author_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the solution author can answer this question.")
        return obj

    def perform_update(self, serializer):
        serializer.save(answered_at=timezone.now())


class SolutionOutcomeView(generics.UpdateAPIView):
    serializer_class = SolutionOutcomeSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Solution.objects.none()
        return visible_solutions(self.request.user).select_related("challenge")

    def get_object(self):
        solution = super().get_object()
        if not solution.is_accepted:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only accepted solutions can record outcomes.")
        if solution.challenge.author_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner can record the outcome.")
        if solution.challenge.status != Challenge.Status.RESOLVED:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Resolve the challenge before recording its outcome.")
        return solution


class SolutionProgressView(generics.UpdateAPIView):
    serializer_class = SolutionProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Solution.objects.none()
        return visible_solutions(self.request.user).select_related("challenge")

    def get_object(self):
        solution = super().get_object()
        if not solution.is_accepted or not can_manage_solution(self.request.user, solution):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner and accepted-solution lead can manage progress.")
        return solution


class SolutionListView(generics.ListAPIView):
    """GET /solutions/?author=<username>"""
    serializer_class = SolutionListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = visible_solutions(self.request.user).select_related("author", "challenge").order_by("-created_at")
        author = self.request.query_params.get("author")
        if author:
            qs = qs.filter(author__username__iexact=author)
        return qs


class ChallengeSolutionListCreateView(generics.ListCreateAPIView):
    """GET/POST /challenges/{challenge_pk}/solutions/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Solution.objects.none()
        return (
            visible_solutions(self.request.user)
            .filter(challenge_id=self.kwargs["challenge_pk"])
            .select_related("author", "challenge")
        )

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            return SolutionCreateSerializer
        return SolutionListSerializer

    def perform_create(self, serializer):
        challenge = get_object_or_404(visible_challenges(self.request.user), pk=self.kwargs["challenge_pk"])
        serializer.save(author=self.request.user, challenge=challenge)


class SolutionDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /solutions/{pk}/ — PATCH creates a revision."""
    serializer_class = SolutionDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        return visible_solutions(self.request.user).select_related("author", "challenge").prefetch_related("revisions__editor")

    def perform_update(self, serializer):
        solution = self.get_object()
        # Create a revision before updating
        SolutionRevision.objects.create(
            solution=solution,
            editor=self.request.user,
            content=serializer.validated_data.get("summary", solution.summary),
            note=self.request.data.get("revision_note", ""),
        )
        serializer.save()


class SolutionVoteView(generics.GenericAPIView):
    """POST /solutions/{pk}/vote/ — body: {"value": 1} or {"value": -1}"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SolutionVoteInputSerializer

    def post(self, request, pk=None):
        solution = get_object_or_404(visible_solutions(request.user), pk=pk)

        if not request.user.is_email_verified:
            return Response(
                {"detail": "Verify your email address before voting on solutions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if solution.author == request.user:
            return Response(
                {"detail": "You cannot vote on your own solution."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_value = request.data.get("value", 1)
        try:
            value = int(raw_value)
        except (ValueError, TypeError):
            value = None

        if value not in (1, -1):
            return Response(
                {"detail": "Value must be 1 or -1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.engagement.models import Vote
        existing = Vote.objects.filter(user=request.user, solution=solution).first()

        if existing:
            if existing.value == value:
                # Remove vote (toggle off)
                existing.delete()
                solution.score = F("score") - value
                solution.save(update_fields=["score"])
                solution.refresh_from_db()
                return Response({"detail": "Vote removed.", "score": solution.score})
            else:
                # Change vote direction
                old_value = existing.value
                existing.value = value
                existing.save(update_fields=["value"])
                solution.score = F("score") - old_value + value
                solution.save(update_fields=["score"])
                solution.refresh_from_db()
                return Response({"detail": "Vote changed.", "score": solution.score})

        Vote.objects.create(user=request.user, solution=solution, value=value)
        solution.score = F("score") + value
        solution.save(update_fields=["score"])
        solution.refresh_from_db()

        # Reputation: +5 per solution upvote
        if value == 1:
            solution.author.reputation += 5
            solution.author.save(update_fields=["reputation"])

        return Response(
            {"detail": "Vote recorded.", "score": solution.score},
            status=status.HTTP_201_CREATED,
        )


class SolutionAcceptView(generics.GenericAPIView):
    """POST /solutions/{pk}/accept/ — challenge owner only."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SolutionDetailSerializer

    def post(self, request, pk=None):
        solution = get_object_or_404(
            visible_solutions(request.user).select_related("challenge__author"), pk=pk
        )
        challenge = solution.challenge

        if challenge.author != request.user:
            return Response(
                {"detail": "Only the challenge owner can accept a solution."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if another solution is already accepted
        if Solution.objects.filter(challenge=challenge, is_accepted=True).exclude(pk=pk).exists():
            return Response(
                {"detail": "Another solution is already accepted for this challenge."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        solution.is_accepted = True
        solution.save(update_fields=["is_accepted"])

        # Move challenge to in_progress
        challenge.status = Challenge.Status.IN_PROGRESS
        challenge.save(update_fields=["status"])
        ChallengeUpdate.objects.create(
            challenge=challenge,
            author=request.user,
            body=f"Accepted solution: {solution.title}",
            status=Challenge.Status.IN_PROGRESS,
        )

        # Reputation: +50 for accepted solution
        solution.author.reputation += 50
        solution.author.save(update_fields=["reputation"])

        # Notify followers
        from apps.notifications.models import Notification
        followers = Follow.objects.filter(challenge=challenge).exclude(user=request.user)
        notifications = [
            Notification(
                recipient=f.user,
                actor=request.user,
                verb="accepted a solution for",
                target_type="challenge",
                target_id=challenge.pk,
                challenge=challenge,
            )
            for f in followers
        ]
        Notification.objects.bulk_create(notifications)

        return Response({"detail": "Solution accepted.", "is_accepted": True})


class SolutionRevisionListView(generics.ListAPIView):
    """GET /solutions/{pk}/revisions/"""
    serializer_class = SolutionRevisionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SolutionRevision.objects.none()
        return (
            SolutionRevision.objects
            .filter(solution__in=visible_solutions(self.request.user), solution_id=self.kwargs["pk"])
            .select_related("editor")
        )
