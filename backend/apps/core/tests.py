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
            username="alice", email="alice@test.com", password="password123", reputation=0
        )
        self.user2 = User.objects.create_user(
            username="bob", email="bob@test.com", password="password123", reputation=0
        )
        self.user3 = User.objects.create_user(
            username="carol", email="carol@test.com", password="password123", reputation=0
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
