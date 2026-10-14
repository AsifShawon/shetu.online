from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole


class ProfileAndMediaPersistenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.consultant = User.objects.create_user(
            email="consultant_media@example.com",
            password="Password123!",
            role=UserRole.CONSULTANT,
            first_name="David",
            last_name="Media",
        )

    def test_consultant_image_upload_and_persistence(self):
        """Image upload via /api/accounts/me/ persists file and returns sanitized media URL."""
        self.client.force_authenticate(user=self.consultant)

        # Valid PNG image bytes generated via Pillow
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\n\x00\x00\x00\n"
            b"\x08\x02\x00\x00\x00\x02PX\xea\x00\x00\x00\x12IDATx\x9cc\xfc\xcf"
            b"\x80\x0f0\xe1\x95\x1d\xb1\xd2\x00A,\x01\x13\xb1\ns\x13\x00\x00\x00"
            b"\x00IEND\xaeB`\x82"
        )
        image_file = SimpleUploadedFile("avatar.png", png_bytes, content_type="image/png")

        response = self.client.patch(
            "/api/accounts/me/",
            {"image": image_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsNotNone(data.get("image_url"))
        self.assertNotIn("backend:8000", data.get("image_url", ""))

        # Verify persistence on subsequent GET /api/accounts/me/
        get_response = self.client.get("/api/accounts/me/")
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(get_response.json().get("image_url"))

        # Verify DB object
        self.consultant.refresh_from_db()
        self.assertTrue(bool(self.consultant.image))
