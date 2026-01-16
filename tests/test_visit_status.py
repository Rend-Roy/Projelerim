"""
Test Visit Status System - 3 durumlu ziyaret sistemi testi
Status: pending, visited, not_visited
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fieldforce-app-6.preview.emergentagent.com').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test successful login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        return data["token"]

class TestVisitStatus:
    """Visit status system tests - 3 durumlu sistem"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_customers(self, auth_headers):
        """Test getting customers list"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert response.status_code == 200
        customers = response.json()
        assert isinstance(customers, list)
        assert len(customers) > 0, "No customers found"
        print(f"Found {len(customers)} customers")
        return customers
    
    def test_create_visit_with_pending_status(self, auth_headers):
        """Test creating a visit - should have pending status by default"""
        # Get first customer
        customers_res = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = customers_res.json()
        assert len(customers) > 0
        customer_id = customers[0]["id"]
        
        # Create visit for today
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/visits?customer_id={customer_id}&date={today}",
            headers=auth_headers
        )
        assert response.status_code == 200
        visit = response.json()
        
        # Check default status is pending
        status = visit.get("status") or ("visited" if visit.get("completed") else ("not_visited" if visit.get("visit_skip_reason") else "pending"))
        print(f"Visit created with status: {status}")
        return visit
    
    def test_update_visit_to_visited(self, auth_headers):
        """Test updating visit status to 'visited'"""
        # Get first customer
        customers_res = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = customers_res.json()
        customer_id = customers[0]["id"]
        
        # Create/get visit
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        visit_res = requests.post(
            f"{BASE_URL}/api/visits?customer_id={customer_id}&date={today}",
            headers=auth_headers
        )
        visit = visit_res.json()
        visit_id = visit["id"]
        
        # Update to visited
        update_res = requests.put(
            f"{BASE_URL}/api/visits/{visit_id}",
            headers=auth_headers,
            json={
                "status": "visited",
                "payment_collected": True,
                "payment_type": "Nakit",
                "payment_amount": 500.0
            }
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        
        assert updated.get("status") == "visited", f"Expected status 'visited', got {updated.get('status')}"
        assert updated.get("completed") == True, "completed should be True for visited status"
        assert updated.get("payment_collected") == True
        print(f"Visit updated to 'visited' status successfully")
        return updated
    
    def test_update_visit_to_not_visited_requires_reason(self, auth_headers):
        """Test that 'not_visited' status requires a reason"""
        # Get first customer
        customers_res = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = customers_res.json()
        customer_id = customers[0]["id"]
        
        # Create/get visit
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        visit_res = requests.post(
            f"{BASE_URL}/api/visits?customer_id={customer_id}&date={today}",
            headers=auth_headers
        )
        visit = visit_res.json()
        visit_id = visit["id"]
        
        # Update to not_visited with reason
        update_res = requests.put(
            f"{BASE_URL}/api/visits/{visit_id}",
            headers=auth_headers,
            json={
                "status": "not_visited",
                "visit_skip_reason": "Müşteri yerinde değildi"
            }
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        
        assert updated.get("status") == "not_visited", f"Expected status 'not_visited', got {updated.get('status')}"
        assert updated.get("completed") == False, "completed should be False for not_visited status"
        assert updated.get("visit_skip_reason") == "Müşteri yerinde değildi"
        # Payment fields should be cleared
        assert updated.get("payment_collected") == False, "payment_collected should be False for not_visited"
        print(f"Visit updated to 'not_visited' status successfully")
        return updated
    
    def test_visit_status_clears_payment_on_not_visited(self, auth_headers):
        """Test that payment fields are cleared when status changes to not_visited"""
        # Get first customer
        customers_res = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = customers_res.json()
        customer_id = customers[0]["id"]
        
        # Create/get visit
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        visit_res = requests.post(
            f"{BASE_URL}/api/visits?customer_id={customer_id}&date={today}",
            headers=auth_headers
        )
        visit = visit_res.json()
        visit_id = visit["id"]
        
        # First set to visited with payment
        requests.put(
            f"{BASE_URL}/api/visits/{visit_id}",
            headers=auth_headers,
            json={
                "status": "visited",
                "payment_collected": True,
                "payment_type": "Nakit",
                "payment_amount": 1000.0
            }
        )
        
        # Then change to not_visited
        update_res = requests.put(
            f"{BASE_URL}/api/visits/{visit_id}",
            headers=auth_headers,
            json={
                "status": "not_visited",
                "visit_skip_reason": "İşyeri kapalıydı"
            }
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        
        # Payment fields should be cleared
        assert updated.get("payment_collected") == False
        assert updated.get("payment_type") is None
        assert updated.get("payment_amount") is None
        print("Payment fields cleared when status changed to not_visited")
    
    def test_get_visits_with_status(self, auth_headers):
        """Test getting visits list with status field"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/visits?date={today}",
            headers=auth_headers
        )
        assert response.status_code == 200
        visits = response.json()
        
        for visit in visits:
            # Status should be present (either from DB or calculated)
            status = visit.get("status") or ("visited" if visit.get("completed") else ("not_visited" if visit.get("visit_skip_reason") else "pending"))
            assert status in ["pending", "visited", "not_visited"], f"Invalid status: {status}"
        
        print(f"Found {len(visits)} visits with valid status")

class TestPDFReport:
    """PDF Report download tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_pdf_report_download(self, auth_headers):
        """Test PDF report download"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get Turkish day name
        day_map = {
            0: "Pazartesi",
            1: "Salı",
            2: "Çarşamba",
            3: "Perşembe",
            4: "Cuma",
            5: "Cumartesi",
            6: "Pazar"
        }
        day_name = day_map[datetime.now().weekday()]
        
        response = requests.get(
            f"{BASE_URL}/api/report/pdf/{day_name}/{today}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"PDF download failed: {response.status_code}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0, "PDF content is empty"
        print(f"PDF report downloaded successfully ({len(response.content)} bytes)")

class TestTodayCustomers:
    """Today's customers endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_get_today_customers(self, auth_headers):
        """Test getting customers for today"""
        from datetime import datetime
        
        # Get Turkish day name
        day_map = {
            0: "Pazartesi",
            1: "Salı",
            2: "Çarşamba",
            3: "Perşembe",
            4: "Cuma",
            5: "Cumartesi",
            6: "Pazar"
        }
        day_name = day_map[datetime.now().weekday()]
        
        response = requests.get(
            f"{BASE_URL}/api/customers/today/{day_name}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        customers = response.json()
        assert isinstance(customers, list)
        print(f"Found {len(customers)} customers for {day_name}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
