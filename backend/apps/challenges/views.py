from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, F, ExpressionWrapper, FloatField, Q
from django.db.models.functions import Extract, Now
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.core.permissions import IsOwnerOrReadOnly
from apps.core.mixins import OwnerOnCreateMixin
from apps.notifications.models import Notification
from .models import Category, Tag, Challenge, ChallengeUpdate, Follow, CommunitySpace, SpaceMembership, SpaceInvitation
from .serializers import (
    CategorySerializer, TagSerializer,
    ChallengeListSerializer, ChallengeDetailSerializer, ChallengeCreateSerializer,
    ChallengeUpdateSerializer,
    CommunitySpaceSerializer,
)
from .filters import ChallengeFilter
from .space_access import can_view_challenge, visible_challenges


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


class CommunitySpaceViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySpaceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        qs = CommunitySpace.objects.select_related("creator").prefetch_related("memberships")
        user = self.request.user
        if not user.is_authenticated:
            return qs.filter(is_private=False)
        return qs.filter(
            permissions_q(user)
        ).distinct()

    def perform_create(self, serializer):
        if not self.request.user.is_email_verified:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Verify your email before creating a community space.")
        space = serializer.save(creator=self.request.user)
        SpaceMembership.objects.get_or_create(space=space, user=self.request.user)

    @action(detail=True, methods=["post"])
    def join(self, request, slug=None):
        space = self.get_object()
        if not request.user.is_email_verified:
            return Response({"detail": "Verify your email before joining a community space."}, status=status.HTTP_403_FORBIDDEN)
        if space.is_private:
            return Response({"detail": "Private spaces require an invitation."}, status=status.HTTP_403_FORBIDDEN)
        SpaceMembership.objects.get_or_create(space=space, user=request.user)
        return Response({"detail": "You joined this space."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def invite(self, request, slug=None):
        space = self.get_object()
        if not request.user.is_email_verified:
            return Response({"detail": "Verify your email before inviting members."}, status=status.HTTP_403_FORBIDDEN)
        if space.creator_id != request.user.id:
            return Response({"detail": "Only the space creator can invite members."}, status=status.HTTP_403_FORBIDDEN)
        username = (request.data.get("username") or "").strip()
        invited_user = get_object_or_404(get_user_model(), username__iexact=username)
        if SpaceMembership.objects.filter(space=space, user=invited_user).exists():
            return Response({"detail": "That person is already a member."}, status=status.HTTP_400_BAD_REQUEST)
        SpaceInvitation.objects.get_or_create(space=space, user=invited_user, defaults={"invited_by": request.user})
        return Response({"detail": "Invitation created."}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def invitations(self, request):
        return Response([
            {"id": invite.id, "space": invite.space.name, "slug": invite.space.slug, "invited_by": invite.invited_by.username}
            for invite in SpaceInvitation.objects.filter(user=request.user, accepted_at__isnull=True).select_related("space", "invited_by")
        ])

    @extend_schema(parameters=[OpenApiParameter("invitation_pk", int, location=OpenApiParameter.PATH)])
    @action(detail=False, methods=["post"], url_path=r"invitations/(?P<invitation_pk>[^/.]+)/accept")
    def accept_invitation(self, request, invitation_pk: int | None = None):
        invite = get_object_or_404(SpaceInvitation, pk=invitation_pk, user=request.user, accepted_at__isnull=True)
        if not request.user.is_email_verified:
            return Response({"detail": "Verify your email before joining a community space."}, status=status.HTTP_403_FORBIDDEN)
        SpaceMembership.objects.get_or_create(space=invite.space, user=request.user)
        invite.accepted_at = timezone.now()
        invite.save(update_fields=["accepted_at"])
        return Response({"detail": "Invitation accepted."})


def permissions_q(user):
    if not user.is_authenticated:
        return Q(is_private=False)
    return Q(is_private=False) | Q(creator=user) | Q(memberships__user=user)


class ChallengeUpdateListCreateView(generics.ListCreateAPIView):
    """List public progress notes; owners and moderators can add notes."""
    serializer_class = ChallengeUpdateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ChallengeUpdate.objects.none()
        challenge = get_object_or_404(Challenge.objects.select_related("space"), pk=self.kwargs["challenge_pk"])
        if not can_view_challenge(self.request.user, challenge):
            return ChallengeUpdate.objects.none()
        return ChallengeUpdate.objects.filter(challenge=challenge).select_related("author")

    def perform_create(self, serializer):
        challenge = get_object_or_404(Challenge, pk=self.kwargs["challenge_pk"])
        user = self.request.user
        if not can_view_challenge(user, challenge):
            from rest_framework.exceptions import NotFound
            raise NotFound("Challenge not found.")
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
            visible_challenges(self.request.user)
            .select_related("author", "category", "space", "space__creator")
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
            if new_status == Challenge.Status.RESOLVED:
                accepted_solution = challenge.solutions.filter(is_accepted=True).first()
                if accepted_solution:
                    accepted_solution.completed_at = timezone.now()
                    accepted_solution.duration_days = max(0, (accepted_solution.completed_at.date() - accepted_solution.created_at.date()).days)
                    accepted_solution.save(update_fields=["completed_at", "duration_days"])
            transaction.on_commit(
                lambda: notify_challenge_followers(challenge, user, "updated the status of")
            )
        serializer = ChallengeDetailSerializer(challenge, context={"request": request})
        return Response({**serializer.data, "detail": f"Status changed to {new_status}."})
