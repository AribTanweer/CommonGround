from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    location = models.CharField(max_length=120, blank=True)
    show_location_publicly = models.BooleanField(default=False)
    profile_is_public = models.BooleanField(default=True)
    reputation = models.IntegerField(default=0)
    is_email_verified = models.BooleanField(default=False)
    email_notifications_enabled = models.BooleanField(default=True)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username
