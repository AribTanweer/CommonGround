from django.contrib import admin
from .models import Comment, Vote, Report


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "challenge", "solution", "parent", "created_at")
    list_filter = ("created_at",)
    search_fields = ("body", "author__username")


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "challenge", "solution", "value")
    list_filter = ("value",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "reporter", "challenge", "solution", "comment", "resolved", "created_at")
    list_filter = ("resolved", "created_at")
    actions = ["mark_resolved", "resolve_and_penalize"]

    @admin.action(description="Mark selected reports as resolved")
    def mark_resolved(self, request, queryset):
        queryset.update(resolved=True)

    @admin.action(description="Resolve and penalize author (-2 reputation)")
    def resolve_and_penalize(self, request, queryset):
        for report in queryset:
            target = report.challenge or report.solution or report.comment
            if target and hasattr(target, "author"):
                target.author.reputation = max(0, target.author.reputation - 2)
                target.author.save(update_fields=["reputation"])
            report.resolved = True
            report.save(update_fields=["resolved"])
