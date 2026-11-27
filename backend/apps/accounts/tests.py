from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("token_obtain_pair")
        self.reset_url = reverse("password_reset")
        self.reset_confirm_url = reverse("password_reset_confirm")
        self.user = User.objects.create_user(
            username="alex_civic",
            email="alex@example.com",
            password="StrongPass123!",
        )

    def test_register_requires_unique_email_and_valid_username(self):
        res_dup_email = self.client.post(
            self.register_url,
            {
                "username": "new_user",
                "email": "ALEX@example.com",
                "password": "AnotherPass123!",
                "password2": "AnotherPass123!",
            },
        )
        self.assertEqual(res_dup_email.status_code, status.HTTP_400_BAD_REQUEST)

        res_bad_username = self.client.post(
            self.register_url,
            {
                "username": "ab",
                "email": "fresh@example.com",
                "password": "AnotherPass123!",
                "password2": "AnotherPass123!",
            },
        )
        self.assertEqual(res_bad_username.status_code, status.HTTP_400_BAD_REQUEST)

        res_mismatch = self.client.post(
            self.register_url,
            {
                "username": "valid_user",
                "email": "fresh@example.com",
                "password": "AnotherPass123!",
                "password2": "DifferentPass123!",
            },
        )
        self.assertEqual(res_mismatch.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_username_or_email(self):
        res_username = self.client.post(
            self.login_url,
            {"username": "alex_civic", "password": "StrongPass123!"},
        )
        self.assertEqual(res_username.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_username.data)

        res_email = self.client.post(
            self.login_url,
            {"username": "ALEX@example.com", "password": "StrongPass123!"},
        )
        self.assertEqual(res_email.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_email.data)

    def test_password_reset_flow(self):
        res_req = self.client.post(self.reset_url, {"email": "alex@example.com"})
        self.assertEqual(res_req.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        self.assertIn("/reset-password?uid=", body)

        # Extract uid & token from email body
        query = body.split("/reset-password?")[1].splitlines()[0]
        params = dict(part.split("=", 1) for part in query.split("&"))

        res_confirm = self.client.post(
            self.reset_confirm_url,
            {
                "uid": params["uid"],
                "token": params["token"],
                "new_password": "NewStrongPass456!",
                "confirm_password": "NewStrongPass456!",
            },
        )
        self.assertEqual(res_confirm.status_code, status.HTTP_200_OK)

        # New password works for login; old password fails
        res_old = self.client.post(
            self.login_url,
            {"username": "alex_civic", "password": "StrongPass123!"},
        )
        self.assertEqual(res_old.status_code, status.HTTP_401_UNAUTHORIZED)

        res_new = self.client.post(
            self.login_url,
            {"username": "alex@example.com", "password": "NewStrongPass456!"},
        )
        self.assertEqual(res_new.status_code, status.HTTP_200_OK)
