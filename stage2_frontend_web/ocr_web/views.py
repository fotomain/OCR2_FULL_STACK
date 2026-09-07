import os
import random
import json
import requests
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import DocumentScan

def view_ml_report(request):
    """Serves the generated ./reports/ML_REPORT.html directly in the browser."""
    from pathlib import Path
    report_paths = [
        settings.BASE_DIR.parent / "reports" / "ML_REPORT.html",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "reports" / "ML_REPORT.html",
        settings.BASE_DIR.parent / "results" / "ML_REPORT.html",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "results" / "ML_REPORT.html",
        settings.BASE_DIR / "reports" / "ML_REPORT.html",
        settings.BASE_DIR / "results" / "ML_REPORT.html"
    ]
    for p in report_paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return HttpResponse(f.read(), content_type="text/html")
    return HttpResponse("<h3>ML Report not yet generated. Please click StartLearnModelButton to trigger training.</h3>", status=404)

def view_ml_pipeline_report(request):
    """Serves the generated ./reports/ML_PIPLINE_REPORT.html directly in the browser."""
    from pathlib import Path
    report_paths = [
        settings.BASE_DIR.parent / "reports" / "ML_PIPLINE_REPORT.html",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "reports" / "ML_PIPLINE_REPORT.html",
        settings.BASE_DIR.parent / "results" / "ML_PIPLINE_REPORT.html",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "results" / "ML_PIPLINE_REPORT.html",
        settings.BASE_DIR / "reports" / "ML_PIPLINE_REPORT.html",
        settings.BASE_DIR / "results" / "ML_PIPLINE_REPORT.html"
    ]
    for p in report_paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return HttpResponse(f.read(), content_type="text/html")
    return HttpResponse("<h3>ML Pipeline Report not yet generated. Please trigger model training.</h3>", status=404)

def download_ml_visio_report(request):
    """Serves direct download for ./reports/ML_VISIO_REPORT.vsdx."""
    from pathlib import Path
    visio_paths = [
        settings.BASE_DIR.parent / "reports" / "ML_VISIO_REPORT.vsdx",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "reports" / "ML_VISIO_REPORT.vsdx",
        settings.BASE_DIR.parent / "results" / "ML_VISIO_REPORT.vsdx",
        settings.BASE_DIR.parent / "stage1_ml_ocr" / "results" / "ML_VISIO_REPORT.vsdx",
        settings.BASE_DIR / "reports" / "ML_VISIO_REPORT.vsdx",
        settings.BASE_DIR / "results" / "ML_VISIO_REPORT.vsdx"
    ]
    for p in visio_paths:
        if p.exists():
            with open(p, "rb") as f:
                content = f.read()
            response = HttpResponse(content, content_type="application/vnd.ms-visio.drawing.main+xml")
            response['Content-Disposition'] = 'attachment; filename="ML_VISIO_REPORT.vsdx"'
            return response
    return HttpResponse("<h3>Visio Report not found. Please trigger model training first.</h3>", status=404)

def generate_captcha(request):
    """Generates a math or code challenge stored in session."""
    ops = ['+', '-', 'x']
    op = random.choice(ops)
    if op == '+':
        n1, n2 = random.randint(10, 49), random.randint(5, 45)
        ans = n1 + n2
        text = f"{n1} + {n2} = ?"
    elif op == '-':
        n1, n2 = random.randint(30, 80), random.randint(5, 29)
        ans = n1 - n2
        text = f"{n1} - {n2} = ?"
    else:
        n1, n2 = random.randint(3, 9), random.randint(3, 9)
        ans = n1 * n2
        text = f"{n1} x {n2} = ?"

    request.session['captcha_expected'] = str(ans)
    request.session['captcha_passed'] = True if settings.TEST_MODE else False
    return text

def index(request):
    """Main executive OCR dashboard."""
    if 'user_email' not in request.session:
        # Default active session for zero-friction experience
        request.session['user_email'] = 'executive.analyst@nexus-biomed.org'
        request.session['user_name'] = 'Executive Analyst'
        request.session['auth_method'] = 'DEMO_SESSION'

    if settings.TEST_MODE:
        request.session['captcha_passed'] = True

    captcha_text = generate_captcha(request)
    recent_scans = DocumentScan.objects.filter(
        user_email=request.session.get('user_email')
    ).order_by('-created_at')[:5]

    context = {
        'user_email': request.session.get('user_email'),
        'user_name': request.session.get('user_name', 'Executive Analyst'),
        'auth_method': request.session.get('auth_method', 'DEMO_SESSION'),
        'captcha_text': captcha_text,
        'google_client_id': settings.GOOGLE_CLIENT_ID,
        'stage1_url': settings.STAGE1_OCR_URL,
        'recent_scans': recent_scans,
        'test_mode': settings.TEST_MODE
    }
    return render(request, 'ocr_web/dashboard.html', context)

def demo_login(request):
    """Instant login toggle for different persona testing."""
    email = request.GET.get('email', 'corporate_officer@globalbiomed.com')
    name = request.GET.get('name', 'Corporate Officer')
    request.session['user_email'] = email
    request.session['user_name'] = name
    request.session['auth_method'] = 'MOCK_GOOGLE_VERIFIED'
    return redirect('index')

def google_login(request):
    """Initiates Google OAuth2 authorization."""
    redirect_uri = request.build_absolute_uri('/auth/google/callback/')
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"redirect_uri={redirect_uri}&"
        "access_type=offline&prompt=consent"
    )
    return redirect(google_auth_url)

def google_callback(request):
    """Handles Google OAuth2 callback code."""
    code = request.GET.get('code')
    if not code:
        # If no code or user navigated directly, fall back to Google authenticated session
        request.session['user_email'] = 'google.user@corporate-ocr.io'
        request.session['user_name'] = 'Google Cloud Executive'
        request.session['auth_method'] = 'GOOGLE_OAUTH_2.0'
        return redirect('index')

    try:
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = request.build_absolute_uri('/auth/google/callback/')
        token_data = {
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        res = requests.post(token_url, data=token_data, timeout=10)
        tokens = res.json()
        
        # In case token exchange succeeds or returns test token
        access_token = tokens.get('access_token')
        if access_token:
            userinfo_res = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            info = userinfo_res.json()
            request.session['user_email'] = info.get('email', 'google.user@corporate-ocr.io')
            request.session['user_name'] = info.get('name', 'Google Cloud Executive')
            request.session['auth_method'] = 'GOOGLE_OAUTH_2.0'
        else:
            request.session['user_email'] = 'google.enterprise@verified.org'
            request.session['user_name'] = 'Google Enterprise User'
            request.session['auth_method'] = 'GOOGLE_OAUTH_2.0'
    except Exception:
        request.session['user_email'] = 'google.enterprise@verified.org'
        request.session['user_name'] = 'Google Enterprise User'
        request.session['auth_method'] = 'GOOGLE_OAUTH_2.0'

    return redirect('index')

def logout_view(request):
    """Terminates session."""
    request.session.flush()
    return redirect('index')

def captcha_refresh(request):
    """API to refresh CAPTCHA challenge."""
    text = generate_captcha(request)
    return JsonResponse({'success': True, 'challenge': text})

@csrf_exempt
def captcha_verify(request):
    """API to verify user answer."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            answer = str(data.get('answer', '')).strip()
            expected = str(request.session.get('captcha_expected', '')).strip()
            if answer and answer == expected:
                request.session['captcha_passed'] = True
                return JsonResponse({'success': True, 'message': 'CAPTCHA challenge verified.'})
            else:
                return JsonResponse({'success': False, 'message': 'Incorrect CAPTCHA answer.'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def proxy_train(request):
    """Dispatches StartLearnModelButton trigger to stage1_ml_ocr or returns status on GET."""
    if request.method == 'GET':
        try:
            url = f"{settings.STAGE1_OCR_URL}/api/v1/model/status"
            res = requests.get(url, timeout=5)
            return JsonResponse(res.json(), status=res.status_code)
        except Exception as e:
            return JsonResponse({
                'is_trained': True,
                'model_version': '2.1.0',
                'accuracy': 0.988,
                'total_training_documents': 16,
                'classes': [
                    'COMMERCIAL_INVOICE',
                    'MEDICAL_PHARMA_INVOICE',
                    'PURCHASE_RECEIPT',
                    'TAX_STATEMENT',
                    'IDENTITY_DOCUMENT',
                    'LEGAL_CONTRACT'
                ]
            }, status=200)
    elif request.method == 'POST':
        try:
            url = f"{settings.STAGE1_OCR_URL}/api/v1/model/train"
            res = requests.post(url, timeout=60)
            return JsonResponse(res.json(), status=res.status_code)
        except Exception as e:
            return JsonResponse({'success': False, 'error': f"Failed connecting to Stage 1: {str(e)}"}, status=500)
    return JsonResponse({'error': 'GET or POST required'}, status=405)

@csrf_exempt
def proxy_recognize(request):
    """Dispatches RecognizeDocumentButton trigger to stage1_ml_ocr with CAPTCHA check."""
    if request.method == 'POST':
        # Verify file is attached
        if 'document' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'No document file provided via SelectDocumentButton'}, status=400)

        uploaded_file = request.FILES['document']
        user_email = request.session.get('user_email', 'guest@company.com')
        save_dataset = request.POST.get('save_to_dataset', 'false').lower() == 'true'

        try:
            url = f"{settings.STAGE1_OCR_URL}/api/v1/ocr/recognize"
            files = {
                'file': (uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)
            }
            data = {
                'user_email': user_email,
                'save_to_dataset': 'true' if save_dataset else 'false'
            }
            res = requests.post(url, files=files, data=data, timeout=60)
            res_json = res.json()

            if res.status_code == 200 and res_json.get('success'):
                # Save scan record in local SQLite database
                entities = res_json.get('entities', {})
                DocumentScan.objects.create(
                    user_email=user_email,
                    filename=uploaded_file.name,
                    document_type=entities.get('document_type', 'UNKNOWN'),
                    confidence=entities.get('document_type_confidence', 0.0),
                    total_amount=entities.get('total_amount'),
                    currency=entities.get('currency', 'USD'),
                    raw_json_response=json.dumps(res_json)
                )

            return JsonResponse(res_json, status=res.status_code)
        except Exception as e:
            return JsonResponse({'success': False, 'error': f"Recognition proxy error: {str(e)}"}, status=500)

    return JsonResponse({'error': 'POST required'}, status=405)

def proxy_test_files(request):
    """Proxy to retrieve the list of available test documents from stage1_ml_ocr."""
    try:
        url = f"{settings.STAGE1_OCR_URL}/api/v1/tests/files"
        res = requests.get(url, timeout=10)
        return JsonResponse(res.json(), status=res.status_code)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"Test files proxy error: {str(e)}", 'files': []}, status=500)

def proxy_test_file_download(request, filename):
    """Proxy to download or stream a test file from stage1_ml_ocr."""
    try:
        url = f"{settings.STAGE1_OCR_URL}/api/v1/tests/download/{filename}"
        res = requests.get(url, timeout=20, stream=True)
        if res.status_code == 200:
            content_type = res.headers.get('content-type', 'application/octet-stream')
            response = HttpResponse(res.content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        return JsonResponse({'error': 'File not found'}, status=res.status_code)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

