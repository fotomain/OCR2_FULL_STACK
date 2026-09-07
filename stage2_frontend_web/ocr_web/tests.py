import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import DocumentScan

class OCRWebDashboardTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_dashboard_renders(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'StartLearnModelButton')
        self.assertContains(response, 'SelectDocumentButton')
        self.assertContains(response, 'RecognizeDdocumentButton')
        self.assertContains(response, 'Single File Only')
        self.assertContains(response, 'Local CAPTCHA')

    def test_captcha_flow(self):
        # Refresh captcha
        res = self.client.get(reverse('captcha_refresh'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('challenge', data)

        # Retrieve session expected answer
        session = self.client.session
        expected = session.get('captcha_expected')
        self.assertIsNotNone(expected)

        # Test incorrect answer
        res_fail = self.client.post(
            reverse('captcha_verify'),
            data=json.dumps({'answer': 'wrong_9999'}),
            content_type='application/json'
        )
        self.assertEqual(res_fail.status_code, 400)

        # Test correct answer
        res_pass = self.client.post(
            reverse('captcha_verify'),
            data=json.dumps({'answer': expected}),
            content_type='application/json'
        )
        self.assertEqual(res_pass.status_code, 200)
        self.assertTrue(res_pass.json()['success'])

    def test_demo_login(self):
        res = self.client.get(reverse('demo_login') + '?email=doctor@clinic.org&name=Dr.+Johnson')
        self.assertEqual(res.status_code, 302)
        session = self.client.session
        self.assertEqual(session.get('user_email'), 'doctor@clinic.org')
        self.assertEqual(session.get('user_name'), 'Dr. Johnson')

    def test_document_scan_model(self):
        scan = DocumentScan.objects.create(
            user_email='test@pharma.com',
            filename='test_invoice.pdf',
            document_type='MEDICAL_PHARMA_INVOICE',
            confidence=0.98,
            total_amount=14500.00,
            currency='USD',
            raw_json_response='{"status": "ok"}'
        )
        self.assertEqual(str(scan), 'test_invoice.pdf (MEDICAL_PHARMA_INVOICE) - test@pharma.com')

    def test_test_mode_bypass_captcha(self):
        with self.settings(TEST_MODE=True):
            res = self.client.get(reverse('index'))
            self.assertEqual(res.status_code, 200)
            self.assertContains(res, 'TEST_MODE: Bypassed')
            self.assertTrue(self.client.session.get('captcha_passed', True))

    def test_proxy_train_get_status(self):
        res = self.client.get(reverse('proxy_train'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('is_trained', data)
        self.assertIn('accuracy', data)
