from django.db import models

class DocumentScan(models.Model):
    user_email = models.CharField(max_length=255, default='guest@company.com')
    filename = models.CharField(max_length=255)
    document_type = models.CharField(max_length=100)
    confidence = models.FloatField(default=0.0)
    total_amount = models.FloatField(null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    raw_json_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} ({self.document_type}) - {self.user_email}"
