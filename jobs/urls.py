from rest_framework.routers import DefaultRouter
from .views import (
    JobViewSet,
    RecruiterApplicantsView,
    UpdateApplicationStatusView,
    RecruiterDashboardStatsView,
    RecruiterApplicationTrendsView,)
from .swipe_views import SwipeJobView
from django.urls import path
from .views import ApplyJobView
from .views import AppliedJobsView
from .views import SavedJobViewSet
from .views import RecommendedJobsView
from .views import DashboardStatsView
from .views import NotificationView

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'saved-jobs', SavedJobViewSet, basename='saved-jobs')

urlpatterns = router.urls
urlpatterns += [
    path("swipe/", SwipeJobView.as_view(), name="swipe-job"),
    path("apply/", ApplyJobView.as_view(), name="apply-job"),
    path("applications/", AppliedJobsView.as_view(), name="applications"),
    path( "recommended-jobs/", RecommendedJobsView.as_view(),name="recommended-jobs",),
    path( "dashboard-stats/",DashboardStatsView.as_view(),name="dashboard-stats"),
    path("notifications/",NotificationView.as_view(),name="notifications"),
    path("recruiter-applicants/",RecruiterApplicantsView.as_view()),
    path(
        "recruiter-applicants/",
        RecruiterApplicantsView.as_view()
    ),

    path(
        "update-application/<int:application_id>/",
        UpdateApplicationStatusView.as_view()
    ),

    path(
        "recruiter-stats/",
        RecruiterDashboardStatsView.as_view()
    ),

    path(
        "recruiter-trends/",
        RecruiterApplicationTrendsView.as_view()
    ),

]