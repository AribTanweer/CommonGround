from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import F

from apps.core.permissions import IsOwnerOrReadOnly
from apps.challenges.models import Challenge, Follow
from .models import Solution, SolutionRevision
from .serializers import (
    SolutionListSerializer, SolutionCreateSerializer,
    SolutionDetailSerializer, SolutionRevisionSerializer,
    SolutionVoteInputSerializer,
)


class ChallengeSolutionListCreateView(generics.ListCreateAPIView):
    """GET/POST /challenges/{challenge_pk}/solutions/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Solution.objects.none()
        return (
            Solution.objects
            .filter(challenge_id=self.kwargs["challenge_pk"])
            .select_related("author", "challenge")
        )

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            return SolutionCreateSerializer
        return SolutionListSerializer

    def perform_create(self, serializer):
        challenge = get_object_or_404(Challenge, pk=self.kwargs["challenge_pk"])
        serializer.save(author=self.request.user, challenge=challenge)


class SolutionDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /solutions/{pk}/ — PATCH creates a revision."""
    queryset = Solution.objects.select_related("author", "challenge").prefetch_related("revisions__editor")
    serializer_class = SolutionDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

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
        solution = get_object_or_404(Solution, pk=pk)

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
            Solution.objects.select_related("challenge__author"), pk=pk
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
            .filter(solution_id=self.kwargs["pk"])
            .select_related("editor")
        )
