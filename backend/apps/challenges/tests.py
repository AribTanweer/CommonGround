from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Challenge, CommunitySpace, SpaceInvitation, SpaceMembership
from apps.solutions.models import Solution

User = get_user_model()


class CommunitySpaceAccessTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("space_owner", email="owner@example.org", password="StrongPass123!", is_email_verified=True)
        self.member = User.objects.create_user("space_member", email="member@example.org", password="StrongPass123!", is_email_verified=True)
        self.outsider = User.objects.create_user("space_outsider", email="outsider@example.org", password="StrongPass123!", is_email_verified=True)
        self.category = Category.objects.create(name="Public Works", slug="public-works")
        self.public_space = CommunitySpace.objects.create(creator=self.owner, name="North Neighbors", kind="neighborhood", description="Local projects")
        self.private_space = CommunitySpace.objects.create(creator=self.owner, name="Mutual Aid Team", kind="organization", description="Private planning", is_private=True)
        SpaceMembership.objects.create(space=self.public_space, user=self.owner)
        SpaceMembership.objects.create(space=self.private_space, user=self.owner)
        SpaceMembership.objects.create(space=self.private_space, user=self.member)
        self.private_challenge = Challenge.objects.create(author=self.owner, title="Private repair plan", description="Members only", category=self.category, space=self.private_space)
        self.private_solution = Solution.objects.create(challenge=self.private_challenge, author=self.owner, title="Members-only plan", summary="Private details")

    def test_private_space_and_challenge_are_hidden_until_membership(self):
        spaces = self.client.get("/api/v1/spaces/")
        self.assertEqual(spaces.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in spaces.data["results"]]
        self.assertNotIn(self.private_space.name, names)
        self.assertEqual(self.client.get(f"/api/v1/challenges/{self.private_challenge.pk}/").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get(f"/api/v1/challenges/{self.private_challenge.pk}/solutions/").data["results"], [])
        self.assertEqual(self.client.get(f"/api/v1/solutions/{self.private_solution.pk}/").status_code, status.HTTP_404_NOT_FOUND)
        global_solutions = self.client.get("/api/v1/solutions/")
        self.assertNotIn(self.private_solution.pk, [item["id"] for item in global_solutions.data["results"]])
        self.assertEqual(self.client.get(f"/api/v1/challenges/{self.private_challenge.pk}/comments/").data["results"], [])

        self.client.force_authenticate(self.member)
        self.assertEqual(self.client.get(f"/api/v1/challenges/{self.private_challenge.pk}/").status_code, status.HTTP_200_OK)
        visible_names = [item["name"] for item in self.client.get("/api/v1/spaces/").data["results"]]
        self.assertIn(self.private_space.name, visible_names)

        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get(f"/api/v1/challenges/{self.private_challenge.pk}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_space_creation_join_and_invitation_permissions(self):
        unverified = User.objects.create_user("unverified", email="unverified@example.org", password="StrongPass123!")
        self.client.force_authenticate(unverified)
        denied = self.client.post("/api/v1/spaces/", {"name": "New group", "kind": "organization", "description": "A group"})
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.outsider)
        joined = self.client.post(f"/api/v1/spaces/{self.public_space.slug}/join/")
        self.assertEqual(joined.status_code, status.HTTP_200_OK)
        private_join = self.client.post(f"/api/v1/spaces/{self.private_space.slug}/join/")
        self.assertEqual(private_join.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.owner)
        invite = self.client.post(f"/api/v1/spaces/{self.private_space.slug}/invite/", {"username": self.outsider.username})
        self.assertEqual(invite.status_code, status.HTTP_201_CREATED)
        invitation = SpaceInvitation.objects.get(space=self.private_space, user=self.outsider)
        self.client.force_authenticate(self.outsider)
        accepted = self.client.post(f"/api/v1/spaces/invitations/{invitation.pk}/accept/")
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)
        self.assertTrue(SpaceMembership.objects.filter(space=self.private_space, user=self.outsider).exists())

    def test_challenge_can_only_be_created_in_a_space_by_a_member(self):
        payload = {"title": "A local idea", "description": "Details", "category": self.category.pk, "space_id": self.private_space.pk}
        self.client.force_authenticate(self.outsider)
        denied = self.client.post("/api/v1/challenges/", payload, format="json")
        self.assertEqual(denied.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(self.member)
        allowed = self.client.post("/api/v1/challenges/", payload, format="json")
        self.assertEqual(allowed.status_code, status.HTTP_201_CREATED)


class ProfilePrivacyTests(APITestCase):
    def test_profile_and_location_privacy_are_opt_in(self):
        user = User.objects.create_user("private_profile", email="private@example.org", password="StrongPass123!", bio="Hidden bio", location="Hidden location", show_location_publicly=True, profile_is_public=False)
        response = self.client.get(f"/api/v1/users/{user.username}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bio"], "")
        self.assertEqual(response.data["location"], "")
        self.assertIsNone(response.data["avatar"])

        user.profile_is_public = True
        user.save(update_fields=["profile_is_public"])
        response = self.client.get(f"/api/v1/users/{user.username}/")
        self.assertEqual(response.data["bio"], "Hidden bio")
        self.assertEqual(response.data["location"], "Hidden location")
