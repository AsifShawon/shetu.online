from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole, VerificationStatus
from apps.assessments.models import Assessment, Review
from apps.catalog.models import Country, ServiceCategory, StudyLevel
from apps.consultants.models import ConsultantService


class ConsultantProfileAndServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.country = Country.objects.create(name="United Kingdom", slug="united-kingdom")
        self.category1 = ServiceCategory.objects.create(name="Admission Guidance", description="Admissions")
        self.category2 = ServiceCategory.objects.create(name="Visa Processing", description="Visa")
        self.study_level = StudyLevel.objects.create(name="Master's Degree", slug="masters")

        self.consultant = User.objects.create_user(
            email="consultant1@example.com",
            password="Password123!",
            role=UserRole.CONSULTANT,
            first_name="Jane",
            last_name="Doe",
            verification_status=VerificationStatus.ACCEPTED,
            present_country=self.country.name,
        )

        self.student = User.objects.create_user(
            email="student1@example.com",
            password="Password123!",
            role=UserRole.STUDENT,
            first_name="John",
            last_name="Smith",
        )

    def test_public_consultant_profile_without_services(self):
        """Valid consultant profile returns 200 even with zero active services."""
        response = self.client.get(f"/api/consultants/public/{self.consultant.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.consultant.id)
        self.assertEqual(data["name"], "Jane Doe")
        self.assertEqual(data["verification_status"], "accepted")

    def test_public_consultant_profile_not_found(self):
        """Missing consultant ID returns 404."""
        response = self.client.get("/api/consultants/public/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_bulk_service_creation_atomic_success(self):
        """Bulk service creation creates all records atomically with authenticated consultant."""
        self.client.force_authenticate(user=self.consultant)

        payload = [
            {
                "title": "UK Admissions",
                "description": "Full UK admissions help",
                "price": "5000.00",
                "duration": "14 days",
                "country_id": self.country.id,
                "service_categories": [self.category1.id],
                "study_levels": [self.study_level.id],
                "status": "active",
            },
            {
                "title": "UK Visa Assistance",
                "description": "Full UK visa support",
                "price": "7000.00",
                "duration": "21 days",
                "country_id": self.country.id,
                "service_categories": [self.category2.id],
                "study_levels": [self.study_level.id],
                "status": "active",
            },
        ]

        response = self.client.post("/api/consultants/services/bulk/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ConsultantService.objects.filter(consultant=self.consultant).count(), 2)

    def test_bulk_service_creation_atomic_rollback(self):
        """When any item in bulk creation is invalid, entire transaction rolls back."""
        self.client.force_authenticate(user=self.consultant)

        payload = [
            {
                "title": "Valid Service",
                "description": "Valid description",
                "price": "5000.00",
                "duration": "14 days",
                "country_id": self.country.id,
                "service_categories": [self.category1.id],
                "study_levels": [self.study_level.id],
                "status": "active",
            },
            {
                "title": "Invalid Service",
                "description": "Invalid country",
                "price": "5000.00",
                "duration": "14 days",
                "country_id": 999999,  # Non-existent country ID
                "service_categories": [self.category2.id],
                "study_levels": [self.study_level.id],
                "status": "active",
            },
        ]

        response = self.client.post("/api/consultants/services/bulk/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Ensure zero services were saved due to rollback
        self.assertEqual(ConsultantService.objects.filter(consultant=self.consultant).count(), 0)

    def test_public_review_filtering_by_consultant(self):
        """Anonymous and authenticated users can view reviews filtered by consultant_id."""
        service = ConsultantService.objects.create(
            consultant=self.consultant,
            title="Admissions",
            price=Decimal("1000.00"),
            duration="7 days",
            country=self.country,
            status="active",
        )
        assessment = Assessment.objects.create(
            student=self.student,
            consultant=self.consultant,
            consultant_service=service,
            assessment_title="UK Guidance",
            assessment_charge=Decimal("1000.00"),
            assessment_duration="7 days",
        )
        Review.objects.create(
            assessment=assessment,
            student=self.student,
            consultant=self.consultant,
            consultant_service=service,
            review_rating=5,
            review_message="Outstanding consultation!",
        )

        # Anonymous query with consultant_id
        response = self.client.get(f"/api/assessments/reviews/?consultant_id={self.consultant.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertEqual(float(results[0]["review_rating"]), 5.0)
