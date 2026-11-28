from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.challenges.models import Category, Challenge, ChallengeUpdate
from .models import ResourceOffer, Solution, SolutionMilestone, SolutionQuestion, VolunteerSignup

User = get_user_model()


class AcceptedSolutionCoordinationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("challenge_owner", email="owner@example.org", password="StrongPass123!", is_email_verified=True)
        self.author = User.objects.create_user("solution_author", email="author@example.org", password="StrongPass123!", is_email_verified=True)
        self.volunteer = User.objects.create_user("volunteer", email="volunteer@example.org", password="StrongPass123!", is_email_verified=True)
        self.outsider = User.objects.create_user("outsider", email="outsider@example.org", password="StrongPass123!", is_email_verified=True)
        category = Category.objects.create(name="Community", slug="community")
        self.challenge = Challenge.objects.create(author=self.owner, title="Safer crossing", description="Improve the crossing", category=category, status=Challenge.Status.IN_PROGRESS)
        self.solution = Solution.objects.create(challenge=self.challenge, author=self.author, title="Paint and visibility upgrade", summary="A phased plan", is_accepted=True)

    def test_only_owner_and_solution_author_can_set_progress_and_milestones(self):
        url = f"/api/v1/solutions/{self.solution.pk}/progress/"
        self.client.force_authenticate(self.outsider)
        denied = self.client.patch(url, {"responsible_party": "City team"}, format="json")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.owner)
        saved = self.client.patch(url, {"responsible_party": "Ward 4 office", "target_date": "2026-12-31"}, format="json")
        self.assertEqual(saved.status_code, status.HTTP_200_OK)
        self.solution.refresh_from_db()
        self.assertEqual(self.solution.responsible_party, "Ward 4 office")
        milestone_url = f"/api/v1/solutions/{self.solution.pk}/milestones/"
        created = self.client.post(milestone_url, {"title": "Complete access audit", "due_date": "2026-12-15"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        milestone = SolutionMilestone.objects.get(pk=created.data["id"])
        completed = self.client.patch(f"/api/v1/milestones/{milestone.pk}/", {"is_complete": True}, format="json")
        self.assertEqual(completed.status_code, status.HTTP_200_OK)
        milestone.refresh_from_db()
        self.assertTrue(milestone.is_complete)
        self.assertIsNotNone(milestone.completed_at)

    def test_volunteer_and_resource_offers_can_be_withdrawn(self):
        self.client.force_authenticate(self.volunteer)
        signup_url = f"/api/v1/solutions/{self.solution.pk}/volunteers/"
        created = self.client.post(signup_url, {"contribution": "Weekend accessibility audit", "note": "Saturday morning"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        signup_id = created.data["id"]
        duplicate = self.client.post(signup_url, {"contribution": "Another role"}, format="json")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.delete(f"/api/v1/volunteers/{signup_id}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VolunteerSignup.objects.filter(pk=signup_id).exists())

        resource_url = f"/api/v1/solutions/{self.solution.pk}/resources/"
        resource = self.client.post(resource_url, {"resource": "Traffic cones", "details": "Six for the audit"}, format="json")
        self.assertEqual(resource.status_code, status.HTTP_201_CREATED)
        resource_id = resource.data["id"]
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.delete(f"/api/v1/resources/{resource_id}/").status_code, status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(self.volunteer)
        self.assertEqual(self.client.delete(f"/api/v1/resources/{resource_id}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ResourceOffer.objects.filter(pk=resource_id).exists())

    def test_unverified_users_cannot_join_solution_coordination(self):
        unverified = User.objects.create_user("not_verified", email="not-verified@example.org", password="StrongPass123!")
        self.client.force_authenticate(unverified)
        response = self.client.post(f"/api/v1/solutions/{self.solution.pk}/volunteers/", {"contribution": "Help"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_questions_are_answered_only_by_solution_author(self):
        self.client.force_authenticate(self.volunteer)
        created = self.client.post(f"/api/v1/solutions/{self.solution.pk}/questions/", {"question": "Who will maintain the paint?"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        question = SolutionQuestion.objects.get(pk=created.data["id"])
        answer_url = f"/api/v1/questions/{question.pk}/answer/"
        self.assertEqual(self.client.patch(answer_url, {"answer": "The ward maintenance team."}, format="json").status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.author)
        answered = self.client.patch(answer_url, {"answer": "The ward maintenance team.", "question": "Tampered question"}, format="json")
        self.assertEqual(answered.status_code, status.HTTP_200_OK)
        question.refresh_from_db()
        self.assertEqual(question.question, "Who will maintain the paint?")
        self.assertEqual(question.answer, "The ward maintenance team.")
        self.assertIsNotNone(question.answered_at)

    def test_resolution_records_duration_and_only_challenge_owner_can_save_outcome(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(f"/api/v1/challenges/{self.challenge.pk}/status/", {"status": "resolved", "note": "Work is complete.", "evidence_url": "https://example.org/evidence"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.solution.refresh_from_db()
        self.assertIsNotNone(self.solution.completed_at)
        self.assertIsNotNone(self.solution.duration_days)
        self.assertTrue(ChallengeUpdate.objects.filter(challenge=self.challenge, status=Challenge.Status.RESOLVED).exists())

        self.client.force_authenticate(self.author)
        direct_patch = self.client.patch(f"/api/v1/solutions/{self.solution.pk}/", {"outcome_notes": "bypass"}, format="json")
        self.assertEqual(direct_patch.status_code, status.HTTP_200_OK)
        self.solution.refresh_from_db()
        self.assertEqual(self.solution.outcome_notes, "")
        self.assertEqual(self.client.patch(f"/api/v1/solutions/{self.solution.pk}/outcome/", {"outcome_notes": "bypass"}, format="json").status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.owner)
        outcome = self.client.patch(f"/api/v1/solutions/{self.solution.pk}/outcome/", {"outcome_notes": "Residents can now cross safely.", "actual_cost": "$1,200", "duration_days": 12, "outcome_evidence_url": "https://example.org/result"}, format="json")
        self.assertEqual(outcome.status_code, status.HTTP_200_OK)
        self.solution.refresh_from_db()
        self.assertEqual(self.solution.actual_cost, "$1,200")
        self.assertEqual(self.solution.duration_days, 12)
