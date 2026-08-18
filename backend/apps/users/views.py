"""User profile views."""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile, RecruiterProfile
from .serializers import (
    UserSerializer, UserUpdateSerializer,
    UserProfileUpdateSerializer, RecruiterProfileUpdateSerializer
)
from .permissions import IsJobSeeker, IsRecruiter


class MeView(generics.RetrieveUpdateAPIView):
    """GET /api/v1/users/me/ — retrieve or update authenticated user."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': UserSerializer(request.user, context={'request': request}).data})


class JobSeekerProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/users/profile/ — job seeker extended profile."""
    permission_classes = [IsAuthenticated, IsJobSeeker]
    serializer_class   = UserProfileUpdateSerializer

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = UserProfileUpdateSerializer(obj)
        return Response({'success': True, 'data': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Mark profile complete if key fields are filled
        user = request.user
        if obj.headline and obj.location:
            user.is_profile_complete = True
            user.save(update_fields=['is_profile_complete'])

        return Response({'success': True, 'data': serializer.data})


class RecruiterProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/users/recruiter-profile/ — recruiter extended profile."""
    permission_classes = [IsAuthenticated, IsRecruiter]
    serializer_class   = RecruiterProfileUpdateSerializer

    def get_object(self):
        profile, _ = RecruiterProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = RecruiterProfileUpdateSerializer(obj)
        return Response({'success': True, 'data': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})
