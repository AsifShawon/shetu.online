from django.db import models

from common.models import TimeStampedModel


class SiteSetting(TimeStampedModel):
    company_name = models.CharField(max_length=255)
    primary_logo = models.ImageField(upload_to="branding/", blank=True, null=True)
    secondary_logo = models.ImageField(upload_to="branding/", blank=True, null=True)
    promo_video = models.URLField(blank=True)
    company_detail = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    facebook = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    youtube = models.URLField(blank=True)
    instagram = models.URLField(blank=True)


class Slider(TimeStampedModel):
    subtitle = models.CharField(max_length=150)
    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    image = models.ImageField(upload_to="sliders/")


class AboutSection(TimeStampedModel):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    image = models.ImageField(upload_to="about/", blank=True, null=True)


class CompanyDetail(TimeStampedModel):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    image = models.ImageField(upload_to="company-details/", blank=True, null=True)


class Testimonial(TimeStampedModel):
    name = models.CharField(max_length=120)
    designation = models.CharField(max_length=120, blank=True)
    description = models.TextField()
    image = models.ImageField(upload_to="testimonials/", blank=True, null=True)


class FAQ(TimeStampedModel):
    question = models.TextField()
    answer = models.TextField()


class TermsDocument(TimeStampedModel):
    title = models.CharField(max_length=255)
    content = models.TextField()


class ContactSubmission(TimeStampedModel):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    service_interest = models.CharField(max_length=120, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField(blank=True)
