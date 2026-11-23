from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    location = models.CharField(max_length=120, blank=True)
    reputation = models.IntegerField(default=0)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username
