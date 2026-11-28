import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("challenges", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ChallengeUpdate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField()),
                ("status", models.CharField(blank=True, choices=[("open", "Open"), ("proposed", "Solutions Proposed"), ("in_progress", "In Progress"), ("resolved", "Resolved"), ("closed", "Closed")], default="", max_length=20)),
                ("evidence_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="challenge_updates", to=settings.AUTH_USER_MODEL)),
                ("challenge", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="updates", to="challenges.challenge")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
