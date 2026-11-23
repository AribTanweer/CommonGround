from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "actor", "verb", "target_type", "target_id", "is_read", "created_at")
    list_filter = ("is_read", "created_at", "target_type")
