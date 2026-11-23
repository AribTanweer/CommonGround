from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer, MarkReadSerializer


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
        ids = request.data.get("ids", None)
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if ids and isinstance(ids, list):
            qs = qs.filter(id__in=ids)
        updated_count = qs.update(is_read=True)
        return Response(
            {"detail": f"Marked {updated_count} notification(s) as read.", "updated_count": updated_count},
            status=status.HTTP_200_OK,
        )


class UnreadCountView(APIView):
    """GET /notifications/unread-count/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count})
