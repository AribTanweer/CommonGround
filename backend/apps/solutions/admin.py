from django.contrib import admin
from .models import Solution, SolutionRevision, SolutionMilestone, VolunteerSignup, ResourceOffer, SolutionQuestion


@admin.register(Solution)
class SolutionAdmin(admin.ModelAdmin):
    list_display = ("title", "challenge", "author", "score", "is_accepted", "created_at")
    list_filter = ("is_accepted", "effort_level")


@admin.register(SolutionRevision)
class SolutionRevisionAdmin(admin.ModelAdmin):
    list_display = ("solution", "editor", "created_at")


admin.site.register(SolutionMilestone)
admin.site.register(VolunteerSignup)
admin.site.register(ResourceOffer)
admin.site.register(SolutionQuestion)
