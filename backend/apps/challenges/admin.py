from django.contrib import admin
from .models import Category, Tag, Challenge, Follow


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "status", "support_count", "created_at")
    list_filter = ("status", "category")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("user", "challenge", "created_at")
