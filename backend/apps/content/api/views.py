from rest_framework import mixins, permissions, viewsets

from apps.content.api.serializers import (
    AboutSectionSerializer,
    ContactSubmissionSerializer,
    FAQSerializer,
    SiteSettingSerializer,
    SliderSerializer,
    TermsDocumentSerializer,
    TestimonialSerializer,
)
from apps.content.models import (
    AboutSection,
    ContactSubmission,
    FAQ,
    SiteSetting,
    Slider,
    TermsDocument,
    Testimonial,
)


class SiteSettingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    permission_classes = [permissions.AllowAny]


class SliderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    permission_classes = [permissions.AllowAny]


class AboutSectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AboutSection.objects.all()
    serializer_class = AboutSectionSerializer
    permission_classes = [permissions.AllowAny]


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.AllowAny]


class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]


class TermsDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TermsDocument.objects.all()
    serializer_class = TermsDocumentSerializer
    permission_classes = [permissions.AllowAny]


class ContactSubmissionViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [permissions.AllowAny]
