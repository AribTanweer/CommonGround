from django.contrib import admin
from .models import Category, Tag, Challenge, Follow, CommunitySpace, SpaceMembership, SpaceInvitation


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


@admin.register(CommunitySpace)
class CommunitySpaceAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "creator", "is_private", "created_at")
    list_filter = ("kind", "is_private")
    search_fields = ("name", "description", "location")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SpaceMembership)
class SpaceMembershipAdmin(admin.ModelAdmin):
    list_display = ("space", "user", "joined_at")
    list_filter = ("space",)


@admin.register(SpaceInvitation)
class SpaceInvitationAdmin(admin.ModelAdmin):
    list_display = ("space", "user", "invited_by", "created_at", "accepted_at")
    list_filter = ("space",)
