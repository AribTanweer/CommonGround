from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, F, ExpressionWrapper, FloatField
from django.db.models.functions import Extract, Now
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsOwnerOrReadOnly
from apps.core.mixins import OwnerOnCreateMixin
from apps.notifications.models import Notification
from .models import Category, Tag, Challenge, ChallengeUpdate, Follow
from .serializers import (
    CategorySerializer, TagSerializer,
    ChallengeListSerializer, ChallengeDetailSerializer, ChallengeCreateSerializer,
    ChallengeUpdateSerializer,
)
from .filters import ChallengeFilter


def notify_challenge_followers(challenge, actor, verb):
    for follow in Follow.objects.filter(challenge=challenge).exclude(user=actor).select_related("user"):
        Notification.objects.create(
            recipient=follow.user,
            actor=actor,
            verb=verb,
            target_type="challenge",
            target_id=challenge.pk,
            challenge=challenge,
        )


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ChallengeUpdateListCreateView(generics.ListCreateAPIView):
    """List public progress notes; owners and moderators can add notes."""
    serializer_class = ChallengeUpdateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ChallengeUpdate.objects.none()
        return ChallengeUpdate.objects.filter(
            challenge_id=self.kwargs["challenge_pk"]
        ).select_related("author")

    def perform_create(self, serializer):
        challenge = get_object_or_404(Challenge, pk=self.kwargs["challenge_pk"])
        user = self.request.user
        is_moderator = user.is_staff or user.groups.filter(name="moderator").exists()
        if challenge.author != user and not is_moderator:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the challenge owner or a moderator can post progress updates.")
        serializer.save(challenge=challenge, author=user)
        transaction.on_commit(
            lambda: notify_challenge_followers(challenge, user, "posted a progress update on")
        )


class ChallengeViewSet(OwnerOnCreateMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_class = ChallengeFilter
    search_fields = ["title", "description"]
    ordering_fields = ["support_count", "created_at", "_solutions_count"]
    ordering = ["-created_at"]
    lookup_field = "pk"

    def get_queryset(self):
        qs = (
            Challenge.objects
            .select_related("author", "category")
            .prefetch_related("tags")
            .annotate(_solutions_count=Count("solutions"))
        )

        ordering = self.request.query_params.get("ordering", "")
        if ordering == "trending":
            qs = qs.order_by("-support_count", "-created_at")

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ChallengeListSerializer
        if self.action == "create":
            return ChallengeCreateSerializer
        return ChallengeDetailSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if str(lookup_value).isdigit():
            filter_kwargs = {"pk": int(lookup_value)}
        else:
            filter_kwargs = {"slug": lookup_value}

        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def support(self, request, pk=None):
        """Toggle support (vote) for a challenge."""
        challenge = self.get_object()
        from apps.engagement.models import Vote

        if not request.user.is_email_verified:
            return Response(
                {"detail": "Verify your email address before supporting challenges."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if challenge.author == request.user:
            return Response(
                {"detail": "You cannot support your own challenge."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = Vote.objects.filter(user=request.user, challenge=challenge)
        if request.method == "DELETE" or existing.exists():
            if existing.exists():
                existing.delete()
                challenge.support_count = max(0, challenge.support_count - 1)
                challenge.save(update_fields=["support_count"])
                return Response({"detail": "Support removed.", "support_count": challenge.support_count})
            return Response({"detail": "Not supported."}, status=status.HTTP_400_BAD_REQUEST)

        Vote.objects.create(user=request.user, challenge=challenge, value=1)
        challenge.support_count = F("support_count") + 1
        challenge.save(update_fields=["support_count"])
        challenge.refresh_from_db()

        # Reputation: +10 when challenge gets 10 supports
        if challenge.support_count == 10:
            challenge.author.reputation += 10
            challenge.author.save(update_fields=["reputation"])

        return Response(
            {"detail": "Challenge supported.", "support_count": challenge.support_count},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        """Toggle follow for a challenge."""
        challenge = self.get_object()

        if request.method == "DELETE":
            Follow.objects.filter(user=request.user, challenge=challenge).delete()
            return Response({"detail": "Unfollowed."})

        _, created = Follow.objects.get_or_create(user=request.user, challenge=challenge)
        if created:
            return Response({"detail": "Following."}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already following."})

    @action(detail=True, methods=["patch"], url_path="status",
            permission_classes=[permissions.IsAuthenticated])
    def change_status(self, request, pk=None):
        """Change status (owner/moderator) and append a status timeline entry."""
        challenge = self.get_object()
        user = request.user

        is_owner = challenge.author == user
        is_moderator = user.is_staff or user.groups.filter(name="moderator").exists()

        if not (is_owner or is_moderator):
            return Response(
                {"detail": "Only the challenge owner or a moderator can change status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        if new_status not in dict(Challenge.Status.choices):
            return Response(
                {"detail": f"Invalid status. Choose from: {list(dict(Challenge.Status.choices).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get("note", "")
        evidence_url = request.data.get("evidence_url", "")
        if not isinstance(note, str) or not isinstance(evidence_url, str):
            return Response({"detail": "Note and evidence URL must be text."}, status=status.HTTP_400_BAD_REQUEST)
        note = note.strip()
        evidence_url = evidence_url.strip()
        if new_status == Challenge.Status.RESOLVED and not evidence_url:
            return Response(
                {"detail": "Add a public evidence link before marking a challenge resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not note:
            note = f"Status changed to {dict(Challenge.Status.choices)[new_status]}."
        update_serializer = ChallengeUpdateSerializer(
            data={"body": note, "evidence_url": evidence_url}
        )
        update_serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            challenge.status = new_status
            challenge.save(update_fields=["status"])
            update_serializer.save(challenge=challenge, author=user, status=new_status)
            transaction.on_commit(
                lambda: notify_challenge_followers(challenge, user, "updated the status of")
            )
        serializer = ChallengeDetailSerializer(challenge, context={"request": request})
        return Response({**serializer.data, "detail": f"Status changed to {new_status}."})
