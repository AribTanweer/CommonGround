from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Notification
from .serializers import NotificationSerializer, MarkReadSerializer, UnreadCountSerializer


class NotificationListView(generics.ListAPIView):
    """GET /notifications/"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related("actor", "challenge")
        )


class MarkNotificationsReadView(generics.GenericAPIView):
    """POST /notifications/mark-read/"""
    serializer_class = MarkReadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        single_id = serializer.validated_data.get("id")
        ids = serializer.validated_data.get("ids")

        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if single_id is not None:
            qs = qs.filter(id=single_id)
        elif ids is not None:
            qs = qs.filter(id__in=ids)
        updated_count = qs.update(is_read=True)
        return Response(
            {"detail": f"Marked {updated_count} notification(s) as read.", "updated_count": updated_count},
            status=status.HTTP_200_OK,
        )


class UnreadCountView(APIView):
    """GET /notifications/unread-count/"""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=UnreadCountSerializer)
    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count})
