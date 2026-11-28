from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.challenges.models import Category, Tag, Challenge, Follow
from apps.solutions.models import Solution
from apps.engagement.models import Comment, Vote, Report
from apps.notifications.models import Notification

User = get_user_model()


class CommonGroundBusinessRulesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username="alice", email="alice@test.com", password="password123", reputation=0,
            is_email_verified=True,
        )
        self.user2 = User.objects.create_user(
            username="bob", email="bob@test.com", password="password123", reputation=0,
            is_email_verified=True,
        )
        self.user3 = User.objects.create_user(
            username="carol", email="carol@test.com", password="password123", reputation=0,
            is_email_verified=True,
        )

        self.category = Category.objects.create(name="Civic", slug="civic")
        self.challenge = Challenge.objects.create(
            author=self.user1,
            title="Broken Sidewalk",
            description="Needs repair urgently",
            category=self.category,
            status=Challenge.Status.OPEN,
        )

    def test_cannot_support_own_challenge(self):
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(f"/api/v1/challenges/{self.challenge.id}/support/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot support your own challenge", res.data["detail"])

    def test_other_user_can_support_challenge_and_reputation_at_10(self):
        self.client.force_authenticate(user=self.user2)
        res = self.client.post(f"/api/v1/challenges/{self.challenge.id}/support/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.challenge.refresh_from_db()
        self.assertEqual(self.challenge.support_count, 1)

        # Toggle support
        res_toggle = self.client.post(f"/api/v1/challenges/{self.challenge.id}/support/")
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        self.challenge.refresh_from_db()
        self.assertEqual(self.challenge.support_count, 0)

    def test_first_solution_moves_challenge_to_proposed(self):
        self.client.force_authenticate(user=self.user2)
        res = self.client.post(
            f"/api/v1/challenges/{self.challenge.id}/solutions/",
            {
                "title": "Fill with asphalt",
                "summary": "Fix in 2 days",
                "estimated_cost": "$200",
                "effort_level": "low",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.challenge.refresh_from_db()
        self.assertEqual(self.challenge.status, Challenge.Status.PROPOSED)

    def test_cannot_vote_on_own_solution(self):
        solution = Solution.objects.create(
            challenge=self.challenge,
            author=self.user2,
            title="Fix it",
            summary="Detail",
            effort_level="low",
        )
        self.client.force_authenticate(user=self.user2)
        res = self.client.post(f"/api/v1/solutions/{solution.id}/vote/", {"value": 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_solution_upvote_increases_author_reputation(self):
        solution = Solution.objects.create(
            challenge=self.challenge,
            author=self.user2,
            title="Fix it",
            summary="Detail",
            effort_level="low",
        )
        self.client.force_authenticate(user=self.user3)
        res = self.client.post(f"/api/v1/solutions/{solution.id}/vote/", {"value": 1})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.user2.refresh_from_db()
        self.assertEqual(self.user2.reputation, 5)

    def test_accept_solution_rules(self):
        # User3 follows the challenge
        Follow.objects.create(user=self.user3, challenge=self.challenge)

        solution = Solution.objects.create(
            challenge=self.challenge,
            author=self.user2,
            title="Fix it",
            summary="Detail",
            effort_level="low",
        )

        # Non-owner cannot accept
        self.client.force_authenticate(user=self.user2)
        res = self.client.post(f"/api/v1/solutions/{solution.id}/accept/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner can accept
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(f"/api/v1/solutions/{solution.id}/accept/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        solution.refresh_from_db()
        self.assertTrue(solution.is_accepted)

        self.challenge.refresh_from_db()
        self.assertEqual(self.challenge.status, Challenge.Status.IN_PROGRESS)

        self.user2.refresh_from_db()
        # +50 for accepted solution
        self.assertEqual(self.user2.reputation, 50)

        # Check notification was created for follower
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user3, target_type="challenge", challenge=self.challenge
            ).exists()
        )

    def test_threaded_comments_and_reports(self):
        self.client.force_authenticate(user=self.user2)
        # Create comment
        res = self.client.post(
            f"/api/v1/challenges/{self.challenge.id}/comments/",
            {"body": "Great challenge!"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        comment_id = res.data["id"]

        # Reply to comment
        res_reply = self.client.post(
            f"/api/v1/challenges/{self.challenge.id}/comments/",
            {"body": "I agree with you", "parent": comment_id},
        )
        self.assertEqual(res_reply.status_code, status.HTTP_201_CREATED)

        # Report comment
        res_report = self.client.post(
            "/api/v1/reports/",
            {"comment": comment_id, "reason": "Spam / duplicate comment"},
        )
        self.assertEqual(res_report.status_code, status.HTTP_201_CREATED)

    def test_stats_and_leaderboard(self):
        res = self.client.get("/api/v1/stats/overview/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("total_challenges", res.data)
        self.assertIn("resolved_count", res.data)

        res_lb = self.client.get("/api/v1/leaderboard/")
        self.assertEqual(res_lb.status_code, status.HTTP_200_OK)

    def test_slug_lookup_and_nested_author(self):
        res = self.client.get(f"/api/v1/challenges/{self.challenge.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], self.challenge.title)
        self.assertIsInstance(res.data["author"], dict)
        self.assertEqual(res.data["author"]["username"], self.user1.username)
        self.assertIn("has_supported", res.data)

    def test_registration_optional_password2(self):
        res = self.client.post("/api/v1/auth/register/", {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "SecureP@ssw0rd2026!",
            "bio": "Community member",
            "location": "Delhi"
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_u = User.objects.get(username="newuser")
        self.assertEqual(new_u.bio, "Community member")
        self.assertEqual(new_u.location, "Delhi")

    def test_category_slug_and_author_filters(self):
        other_cat = Category.objects.create(name="Environment", slug="environment")
        Challenge.objects.create(
            author=self.user2,
            title="Plant Trees",
            description="More shade needed",
            category=other_cat,
        )

        res_slug = self.client.get("/api/v1/challenges/?category=civic")
        self.assertEqual(res_slug.status_code, status.HTTP_200_OK)
        self.assertEqual(res_slug.data["count"], 1)
        self.assertEqual(res_slug.data["results"][0]["title"], "Broken Sidewalk")

        res_id = self.client.get(f"/api/v1/challenges/?category={other_cat.id}")
        self.assertEqual(res_id.status_code, status.HTTP_200_OK)
        self.assertEqual(res_id.data["count"], 1)
        self.assertEqual(res_id.data["results"][0]["title"], "Plant Trees")

        res_author = self.client.get("/api/v1/challenges/?author=alice")
        self.assertEqual(res_author.status_code, status.HTTP_200_OK)
        self.assertEqual(res_author.data["count"], 1)
        self.assertEqual(res_author.data["results"][0]["author"]["username"], "alice")

    def test_non_owner_cannot_patch_solution(self):
        solution = Solution.objects.create(
            challenge=self.challenge,
            author=self.user2,
            title="Fix it",
            summary="Initial plan",
            effort_level="low",
        )
        self.client.force_authenticate(user=self.user3)
        res_forbidden = self.client.patch(
            f"/api/v1/solutions/{solution.id}/",
            {"summary": "Hijacked plan"},
        )
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user2)
        res_ok = self.client.patch(
            f"/api/v1/solutions/{solution.id}/",
            {"summary": "Updated plan", "revision_note": "Clarified steps"},
        )
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(solution.revisions.count(), 1)

    def test_notification_nested_shape_and_single_mark_read(self):
        n1 = Notification.objects.create(
            recipient=self.user1,
            actor=self.user2,
            verb="supported your challenge",
            target_type="challenge",
            target_id=self.challenge.id,
            challenge=self.challenge,
        )
        n2 = Notification.objects.create(
            recipient=self.user1,
            actor=self.user3,
            verb="commented on your challenge",
            target_type="challenge",
            target_id=self.challenge.id,
            challenge=self.challenge,
        )

        self.client.force_authenticate(user=self.user1)
        res_list = self.client.get("/api/v1/notifications/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        first = res_list.data["results"][0]
        self.assertIsInstance(first["actor"], dict)
        self.assertIn("username", first["actor"])
        self.assertIsInstance(first["challenge"], dict)
        self.assertEqual(first["challenge"]["id"], self.challenge.id)

        # Mark only n1 read via single id
        res_mark = self.client.post("/api/v1/notifications/mark-read/", {"id": n1.id}, format="json")
        self.assertEqual(res_mark.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mark.data["updated_count"], 1)
        n1.refresh_from_db()
        n2.refresh_from_db()
        self.assertTrue(n1.is_read)
        self.assertFalse(n2.is_read)

    def test_stats_overview_and_status_update_payload(self):
        Solution.objects.create(
            challenge=self.challenge,
            author=self.user2,
            title="Resurface",
            summary="Steps",
            effort_level="med",
        )
        res_stats = self.client.get("/api/v1/stats/overview/")
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stats.data["total_solutions"], 1)
        self.assertIn("resolved_over_time", res_stats.data)
        self.assertGreaterEqual(len(res_stats.data["resolved_over_time"]), 1)

        self.client.force_authenticate(user=self.user1)
        res_status = self.client.patch(
            f"/api/v1/challenges/{self.challenge.id}/status/",
            {"status": "resolved"},
            format="json",
        )
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        self.assertEqual(res_status.data["status"], "resolved")
        self.assertEqual(res_status.data["id"], self.challenge.id)
        self.assertEqual(res_status.data["slug"], self.challenge.slug)
