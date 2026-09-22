from django.db import models

from common.models import TimeStampedModel


class AgencyProfile(TimeStampedModel):
    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="agency_profile"
    )
    slogan = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    banner_heading = models.CharField(max_length=255, blank=True)
    sub_heading = models.CharField(max_length=255, blank=True)
    banner = models.ImageField(upload_to="agencies/banner/", blank=True, null=True)
    about_text = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    policy = models.TextField(blank=True)
    map_link = models.URLField(blank=True)
    image = models.ImageField(upload_to="agencies/profile/", blank=True, null=True)


class AgencyConsultant(TimeStampedModel):
    agency = models.ForeignKey(
        AgencyProfile, on_delete=models.CASCADE, related_name="consultants"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="agency_memberships"
    )


class AgencyService(TimeStampedModel):
    agency = models.ForeignKey(
        AgencyProfile, on_delete=models.CASCADE, related_name="services"
    )
    service_category = models.ForeignKey(
        "catalog.ServiceCategory", on_delete=models.CASCADE, related_name="agency_services"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="agencies/services/", blank=True, null=True)
    active = models.BooleanField(default=True)


class AgencyCountryOffering(TimeStampedModel):
    agency = models.ForeignKey(
        AgencyProfile, on_delete=models.CASCADE, related_name="country_offerings"
    )
    country = models.ForeignKey(
        "catalog.Country", on_delete=models.CASCADE, related_name="agency_offerings"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="agencies/countries/", blank=True, null=True)
    active = models.BooleanField(default=True)


class AgencyGalleryImage(TimeStampedModel):
    agency = models.ForeignKey(
        AgencyProfile, on_delete=models.CASCADE, related_name="gallery_images"
    )
    image = models.ImageField(upload_to="agencies/gallery/")
    active = models.BooleanField(default=True)
