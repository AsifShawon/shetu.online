from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.agencies.models import AgencyCountryOffering, AgencyProfile, AgencyService
from apps.catalog.models import Country, ServiceCategory


class AgencyDashboardAndOwnershipTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.category = ServiceCategory.objects.create(name="Study Visa", description="Visas")
        self.country = Country.objects.create(name="Canada", slug="canada")

        self.agency_user_a = User.objects.create_user(
            email="agencyA@example.com",
            password="Password123!",
            role=UserRole.AGENCY,
            first_name="Alpha",
            last_name="Agency",
        )

        self.agency_user_b = User.objects.create_user(
            email="agencyB@example.com",
            password="Password123!",
            role=UserRole.AGENCY,
            first_name="Beta",
            last_name="Agency",
        )

    def test_absent_agency_profile_explicit_error(self):
        """Creating agency items without a profile returns explicit error."""
        self.client.force_authenticate(user=self.agency_user_a)

        response = self.client.post(
            "/api/agencies/services/",
            {"title": "Test Service", "service_category_id": self.category.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Agency profile not found", str(response.json()))

    def test_agency_profile_creation_and_immutable_ownership(self):
        """Agency profile assigns request.user server-side and rejects duplicates."""
        self.client.force_authenticate(user=self.agency_user_a)

        response = self.client.post(
            "/api/agencies/profile/",
            {"slogan": "Excellence in Education", "banner_heading": "Study Abroad"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        profile = AgencyProfile.objects.get(user=self.agency_user_a)
        self.assertEqual(profile.slogan, "Excellence in Education")

        # Second creation should be rejected as an agency profile already exists
        dup_response = self.client.post(
            "/api/agencies/profile/",
            {"slogan": "Duplicate"},
            format="json",
        )
        self.assertEqual(dup_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agency_service_creation_and_cross_account_isolation(self):
        """Agency services assign agency server-side and deny access across tenants."""
        profile_a = AgencyProfile.objects.create(user=self.agency_user_a, slogan="Agency A")
        profile_b = AgencyProfile.objects.create(user=self.agency_user_b, slogan="Agency B")

        # Agency A creates service
        self.client.force_authenticate(user=self.agency_user_a)
        response = self.client.post(
            "/api/agencies/services/",
            {
                "title": "Canada Study Visa Support",
                "description": "Comprehensive help",
                "service_category_id": self.category.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        service_id = response.json()["id"]

        service = AgencyService.objects.get(id=service_id)
        self.assertEqual(service.agency, profile_a)
        self.assertEqual(service.service_category, self.category)

        # Agency B cannot view or modify Agency A's service
        self.client.force_authenticate(user=self.agency_user_b)
        b_list = self.client.get("/api/agencies/services/")
        self.assertEqual(b_list.status_code, status.HTTP_200_OK)
        b_results = b_list.json() if isinstance(b_list.json(), list) else b_list.json().get("results", [])
        self.assertEqual(len(b_results), 0)

        b_patch = self.client.patch(f"/api/agencies/services/{service_id}/", {"title": "Hacked"}, format="json")
        self.assertEqual(b_patch.status_code, status.HTTP_404_NOT_FOUND)

        b_delete = self.client.delete(f"/api/agencies/services/{service_id}/")
        self.assertEqual(b_delete.status_code, status.HTTP_404_NOT_FOUND)
        # Service still intact
        self.assertTrue(AgencyService.objects.filter(id=service_id).exists())
