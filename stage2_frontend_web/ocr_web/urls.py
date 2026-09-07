from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('auth/google/login/', views.google_login, name='google_login'),
    path('auth/google/callback/', views.google_callback, name='google_callback'),
    path('auth/demo/', views.demo_login, name='demo_login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('api/captcha/refresh/', views.captcha_refresh, name='captcha_refresh'),
    path('api/captcha/verify/', views.captcha_verify, name='captcha_verify'),
    path('api/proxy/train/', views.proxy_train, name='proxy_train'),
    path('api/proxy/recognize/', views.proxy_recognize, name='proxy_recognize'),
    path('api/proxy/tests/', views.proxy_test_files, name='proxy_test_files'),
    path('api/proxy/tests/download/<str:filename>/', views.proxy_test_file_download, name='proxy_test_file_download'),
    path('reports/ML_REPORT.html', views.view_ml_report, name='reports_ml_report_html'),
    path('reports/ML_PIPLINE_REPORT.html', views.view_ml_pipeline_report, name='reports_ml_pipeline_report_html'),
    path('reports/ML_VISIO_REPORT.vsdx', views.download_ml_visio_report, name='reports_ml_visio_vsdx'),
    path('results/ML_REPORT.html', views.view_ml_report, name='ml_report_html'),
    path('results/ML_REPORT.hml', views.view_ml_report, name='ml_report_hml'),
    path('results/ML_PIPLINE_REPORT.html', views.view_ml_pipeline_report, name='ml_pipeline_report_html'),
    path('results/ML_VISIO_REPORT.vsdx', views.download_ml_visio_report, name='results_ml_visio_vsdx'),
    path('report/ml/', views.view_ml_report, name='ml_report_view'),
    path('report/pipeline/', views.view_ml_pipeline_report, name='ml_pipeline_report_view'),
    path('report/visio/', views.download_ml_visio_report, name='ml_visio_report_view'),
]


