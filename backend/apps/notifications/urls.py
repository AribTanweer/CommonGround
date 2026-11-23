from django.urls import path
from .views import NotificationListView, MarkNotificationsReadView, UnreadCountView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/mark-read/", MarkNotificationsReadView.as_view(), name="notification-mark-read"),
    path("notifications/unread-count/", UnreadCountView.as_view(), name="notification-unread-count"),
]
