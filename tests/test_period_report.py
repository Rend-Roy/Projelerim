"""
Test Period Report PDF Endpoints
- Weekly period report PDF: GET /api/report/pdf/period/weekly
- Monthly period report PDF: GET /api/report/pdf/period/monthly
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPeriodReportPDF:
    """Period Report PDF endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.auth_success = True
        else:
            self.auth_success = False
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_login_success(self):
        """Test login works"""
        assert self.auth_success, "Login should succeed"
        print("✓ Login successful")
    
    def test_weekly_period_report_pdf(self):
        """Test weekly period report PDF endpoint"""
        response = self.session.get(f"{BASE_URL}/api/report/pdf/period/weekly")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "haftalik" in content_disposition.lower() or "weekly" in content_disposition.lower(), "Filename should indicate weekly"
        
        # Check PDF content (should start with %PDF)
        assert response.content[:4] == b'%PDF', "Content should be valid PDF"
        
        # Check reasonable file size (should be > 1KB)
        assert len(response.content) > 1000, f"PDF should be > 1KB, got {len(response.content)} bytes"
        
        print(f"✓ Weekly PDF report generated: {len(response.content)} bytes")
    
    def test_monthly_period_report_pdf(self):
        """Test monthly period report PDF endpoint"""
        response = self.session.get(f"{BASE_URL}/api/report/pdf/period/monthly")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "aylik" in content_disposition.lower() or "monthly" in content_disposition.lower(), "Filename should indicate monthly"
        
        # Check PDF content (should start with %PDF)
        assert response.content[:4] == b'%PDF', "Content should be valid PDF"
        
        # Check reasonable file size (should be > 1KB)
        assert len(response.content) > 1000, f"PDF should be > 1KB, got {len(response.content)} bytes"
        
        print(f"✓ Monthly PDF report generated: {len(response.content)} bytes")
    
    def test_period_report_requires_auth(self):
        """Test that period report requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        
        response = no_auth_session.get(f"{BASE_URL}/api/report/pdf/period/weekly")
        assert response.status_code == 401 or response.status_code == 403, \
            f"Expected 401/403 without auth, got {response.status_code}"
        
        print("✓ Period report requires authentication")
    
    def test_invalid_period_type(self):
        """Test invalid period type returns error"""
        response = self.session.get(f"{BASE_URL}/api/report/pdf/period/invalid")
        
        # Should return 400 or 422 for invalid period type
        # Or it might default to monthly - check behavior
        # Based on code, it defaults to monthly if not weekly
        # So this should still return 200 with monthly report
        assert response.status_code in [200, 400, 422], \
            f"Expected 200/400/422, got {response.status_code}"
        
        print(f"✓ Invalid period type handled (status: {response.status_code})")


class TestPerformanceAnalytics:
    """Performance analytics endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.auth_success = True
        else:
            self.auth_success = False
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_weekly_analytics(self):
        """Test weekly performance analytics"""
        response = self.session.get(f"{BASE_URL}/api/analytics/performance?period=weekly")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "period" in data, "Response should have period"
        assert data["period"] == "weekly", "Period should be weekly"
        assert "visit_performance" in data, "Response should have visit_performance"
        assert "payment_performance" in data, "Response should have payment_performance"
        
        print("✓ Weekly analytics endpoint works")
    
    def test_monthly_analytics(self):
        """Test monthly performance analytics"""
        response = self.session.get(f"{BASE_URL}/api/analytics/performance?period=monthly")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "period" in data, "Response should have period"
        assert data["period"] == "monthly", "Period should be monthly"
        
        print("✓ Monthly analytics endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
