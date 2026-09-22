from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Notification, NotificationKind, User, UserRole


class NotificationAPITests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="student-notifications@example.com",
            password="password123",
            role=UserRole.STUDENT,
        )
        self.consultant = User.objects.create_user(
            email="consultant-notifications@example.com",
            password="password123",
            role=UserRole.CONSULTANT,
        )
        self.agency = User.objects.create_user(
            email="agency-notifications@example.com",
            password="password123",
            role=UserRole.AGENCY,
        )

    def test_each_supported_role_can_list_only_its_notifications(self):
        for user in (self.student, self.consultant, self.agency):
            Notification.objects.create(
                recipient=user,
                title=f"Hello {user.role}",
                message="Role-specific update",
                kind=NotificationKind.INFO,
            )

        for user in (self.student, self.consultant, self.agency):
            self.client.force_authenticate(user)
            api_response = self.client.get("/api/accounts/notifications/")

            self.assertEqual(status.HTTP_200_OK, api_response.status_code)
            self.assertEqual(1, api_response.data["unread_count"])
            self.assertEqual(1, len(api_response.data["notifications"]))
            self.assertEqual(
                f"Hello {user.role}",
                api_response.data["notifications"][0]["title"],
            )

    def test_user_cannot_mark_another_users_notification_read(self):
        notification = Notification.objects.create(
            recipient=self.consultant,
            title="Private consultant update",
        )
        self.client.force_authenticate(self.student)

        api_response = self.client.patch(
            f"/api/accounts/notifications/{notification.id}/read/",
        )

        self.assertEqual(status.HTTP_404_NOT_FOUND, api_response.status_code)
        notification.refresh_from_db()
        self.assertIsNone(notification.read_at)

    def test_mark_one_and_mark_all_persist_read_state(self):
        first = Notification.objects.create(recipient=self.student, title="First")
        second = Notification.objects.create(recipient=self.student, title="Second")
        already_read = Notification.objects.create(
            recipient=self.student,
            title="Already read",
            read_at=timezone.now(),
        )
        self.client.force_authenticate(self.student)

        read_response = self.client.patch(
            f"/api/accounts/notifications/{first.id}/read/",
        )
        self.assertEqual(status.HTTP_200_OK, read_response.status_code)
        self.assertTrue(read_response.data["is_read"])

        read_all_response = self.client.post("/api/accounts/notifications/read-all/")
        self.assertEqual(status.HTTP_200_OK, read_all_response.status_code)
        self.assertEqual(1, read_all_response.data["updated_count"])
        self.assertEqual(0, read_all_response.data["unread_count"])

        first.refresh_from_db()
        second.refresh_from_db()
        already_read.refresh_from_db()
        self.assertIsNotNone(first.read_at)
        self.assertIsNotNone(second.read_at)
        self.assertIsNotNone(already_read.read_at)

    def test_anonymous_user_cannot_access_notifications(self):
        api_response = self.client.get("/api/accounts/notifications/")
        self.assertEqual(status.HTTP_403_FORBIDDEN, api_response.status_code)
