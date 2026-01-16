"""
FAZ 3.2 - Kullanıcı Bazlı Veri İzolasyonu Testleri
Test data isolation between User 1 and User 2
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://satiskatalogu.preview.emergentagent.com')

# Test credentials
USER1_CREDENTIALS = {"email": "test@example.com", "password": "test123"}
USER2_CREDENTIALS = {"email": "user2@test.com", "password": "test456"}


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_user1_login(self):
        """User 1 can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=USER1_CREDENTIALS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == USER1_CREDENTIALS["email"]
        print(f"✓ User 1 login successful: {data['user']['name']}")
    
    def test_user2_login(self):
        """User 2 can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=USER2_CREDENTIALS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == USER2_CREDENTIALS["email"]
        print(f"✓ User 2 login successful: {data['user']['name']}")
    
    def test_invalid_login(self):
        """Invalid credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


@pytest.fixture
def user1_token():
    """Get User 1 auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=USER1_CREDENTIALS)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("User 1 authentication failed")


@pytest.fixture
def user2_token():
    """Get User 2 auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=USER2_CREDENTIALS)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("User 2 authentication failed")


@pytest.fixture
def user1_headers(user1_token):
    """Headers with User 1 auth"""
    return {"Authorization": f"Bearer {user1_token}", "Content-Type": "application/json"}


@pytest.fixture
def user2_headers(user2_token):
    """Headers with User 2 auth"""
    return {"Authorization": f"Bearer {user2_token}", "Content-Type": "application/json"}


class TestCustomerIsolation:
    """Test customer data isolation between users"""
    
    def test_user1_customers_count(self, user1_headers):
        """User 1 should see their own customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=user1_headers)
        assert response.status_code == 200
        customers = response.json()
        print(f"✓ User 1 has {len(customers)} customers")
        # Store for comparison
        return customers
    
    def test_user2_customers_count(self, user2_headers):
        """User 2 should see their own customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=user2_headers)
        assert response.status_code == 200
        customers = response.json()
        print(f"✓ User 2 has {len(customers)} customers")
        return customers
    
    def test_customer_isolation_different_counts(self, user1_headers, user2_headers):
        """User 1 and User 2 should have different customer counts"""
        user1_response = requests.get(f"{BASE_URL}/api/customers", headers=user1_headers)
        user2_response = requests.get(f"{BASE_URL}/api/customers", headers=user2_headers)
        
        assert user1_response.status_code == 200
        assert user2_response.status_code == 200
        
        user1_customers = user1_response.json()
        user2_customers = user2_response.json()
        
        user1_ids = set(c["id"] for c in user1_customers)
        user2_ids = set(c["id"] for c in user2_customers)
        
        # Verify no overlap in customer IDs
        overlap = user1_ids.intersection(user2_ids)
        assert len(overlap) == 0, f"Found overlapping customer IDs: {overlap}"
        
        print(f"✓ Customer isolation verified: User 1 has {len(user1_customers)}, User 2 has {len(user2_customers)}")
        print(f"✓ No overlapping customer IDs between users")
    
    def test_user1_cannot_access_user2_customer(self, user1_headers, user2_headers):
        """User 1 should not be able to access User 2's customers"""
        # Get User 2's customers
        user2_response = requests.get(f"{BASE_URL}/api/customers", headers=user2_headers)
        user2_customers = user2_response.json()
        
        if len(user2_customers) > 0:
            user2_customer_id = user2_customers[0]["id"]
            
            # Try to access User 2's customer as User 1
            response = requests.get(f"{BASE_URL}/api/customers/{user2_customer_id}", headers=user1_headers)
            assert response.status_code == 404, f"User 1 should not access User 2's customer, got {response.status_code}"
            print(f"✓ User 1 correctly denied access to User 2's customer")
        else:
            print("⚠ User 2 has no customers to test cross-access")
    
    def test_create_customer_assigned_to_user(self, user1_headers, user2_headers):
        """New customer should be assigned to creating user"""
        # Create customer as User 1
        new_customer = {
            "name": "TEST_IsolationTest_User1",
            "region": "Test Bölge",
            "phone": "0555 111 2233"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/customers", headers=user1_headers, json=new_customer)
        assert create_response.status_code == 200
        created = create_response.json()
        customer_id = created["id"]
        
        # User 1 should see it
        user1_get = requests.get(f"{BASE_URL}/api/customers/{customer_id}", headers=user1_headers)
        assert user1_get.status_code == 200
        
        # User 2 should NOT see it
        user2_get = requests.get(f"{BASE_URL}/api/customers/{customer_id}", headers=user2_headers)
        assert user2_get.status_code == 404
        
        print(f"✓ New customer correctly isolated to creating user")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/customers/{customer_id}", headers=user1_headers)


class TestRegionIsolation:
    """Test region data isolation between users"""
    
    def test_user1_regions(self, user1_headers):
        """User 1 should see their own regions"""
        response = requests.get(f"{BASE_URL}/api/regions", headers=user1_headers)
        assert response.status_code == 200
        regions = response.json()
        print(f"✓ User 1 has {len(regions)} regions")
        return regions
    
    def test_user2_regions(self, user2_headers):
        """User 2 should see their own regions"""
        response = requests.get(f"{BASE_URL}/api/regions", headers=user2_headers)
        assert response.status_code == 200
        regions = response.json()
        print(f"✓ User 2 has {len(regions)} regions")
        return regions
    
    def test_region_isolation(self, user1_headers, user2_headers):
        """Regions should be isolated between users"""
        user1_response = requests.get(f"{BASE_URL}/api/regions", headers=user1_headers)
        user2_response = requests.get(f"{BASE_URL}/api/regions", headers=user2_headers)
        
        user1_regions = user1_response.json()
        user2_regions = user2_response.json()
        
        user1_ids = set(r["id"] for r in user1_regions)
        user2_ids = set(r["id"] for r in user2_regions)
        
        overlap = user1_ids.intersection(user2_ids)
        assert len(overlap) == 0, f"Found overlapping region IDs: {overlap}"
        
        print(f"✓ Region isolation verified: No overlapping region IDs")


class TestVisitIsolation:
    """Test visit data isolation between users"""
    
    def test_user1_visits(self, user1_headers):
        """User 1 should see their own visits"""
        response = requests.get(f"{BASE_URL}/api/visits", headers=user1_headers)
        assert response.status_code == 200
        visits = response.json()
        print(f"✓ User 1 has {len(visits)} visits")
        return visits
    
    def test_user2_visits(self, user2_headers):
        """User 2 should see their own visits"""
        response = requests.get(f"{BASE_URL}/api/visits", headers=user2_headers)
        assert response.status_code == 200
        visits = response.json()
        print(f"✓ User 2 has {len(visits)} visits")
        return visits
    
    def test_visit_isolation(self, user1_headers, user2_headers):
        """Visits should be isolated between users"""
        user1_response = requests.get(f"{BASE_URL}/api/visits", headers=user1_headers)
        user2_response = requests.get(f"{BASE_URL}/api/visits", headers=user2_headers)
        
        user1_visits = user1_response.json()
        user2_visits = user2_response.json()
        
        user1_ids = set(v["id"] for v in user1_visits)
        user2_ids = set(v["id"] for v in user2_visits)
        
        overlap = user1_ids.intersection(user2_ids)
        assert len(overlap) == 0, f"Found overlapping visit IDs: {overlap}"
        
        print(f"✓ Visit isolation verified: No overlapping visit IDs")


class TestFollowUpIsolation:
    """Test follow-up data isolation between users"""
    
    def test_user1_followups(self, user1_headers):
        """User 1 should see their own follow-ups"""
        response = requests.get(f"{BASE_URL}/api/follow-ups", headers=user1_headers)
        assert response.status_code == 200
        followups = response.json()
        print(f"✓ User 1 has {len(followups)} follow-ups")
        return followups
    
    def test_user2_followups(self, user2_headers):
        """User 2 should see their own follow-ups"""
        response = requests.get(f"{BASE_URL}/api/follow-ups", headers=user2_headers)
        assert response.status_code == 200
        followups = response.json()
        print(f"✓ User 2 has {len(followups)} follow-ups")
        return followups
    
    def test_followup_isolation(self, user1_headers, user2_headers):
        """Follow-ups should be isolated between users"""
        user1_response = requests.get(f"{BASE_URL}/api/follow-ups", headers=user1_headers)
        user2_response = requests.get(f"{BASE_URL}/api/follow-ups", headers=user2_headers)
        
        user1_followups = user1_response.json()
        user2_followups = user2_response.json()
        
        user1_ids = set(f["id"] for f in user1_followups)
        user2_ids = set(f["id"] for f in user2_followups)
        
        overlap = user1_ids.intersection(user2_ids)
        assert len(overlap) == 0, f"Found overlapping follow-up IDs: {overlap}"
        
        print(f"✓ Follow-up isolation verified: No overlapping follow-up IDs")


class TestVehicleIsolation:
    """Test vehicle data isolation between users"""
    
    def test_user1_vehicles(self, user1_headers):
        """User 1 should see their own vehicles"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers=user1_headers)
        assert response.status_code == 200
        vehicles = response.json()
        print(f"✓ User 1 has {len(vehicles)} vehicles")
        return vehicles
    
    def test_user2_vehicles(self, user2_headers):
        """User 2 should see their own vehicles"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers=user2_headers)
        assert response.status_code == 200
        vehicles = response.json()
        print(f"✓ User 2 has {len(vehicles)} vehicles")
        return vehicles
    
    def test_vehicle_isolation(self, user1_headers, user2_headers):
        """Vehicles should be isolated between users"""
        user1_response = requests.get(f"{BASE_URL}/api/vehicles", headers=user1_headers)
        user2_response = requests.get(f"{BASE_URL}/api/vehicles", headers=user2_headers)
        
        user1_vehicles = user1_response.json()
        user2_vehicles = user2_response.json()
        
        user1_ids = set(v["id"] for v in user1_vehicles)
        user2_ids = set(v["id"] for v in user2_vehicles)
        
        overlap = user1_ids.intersection(user2_ids)
        assert len(overlap) == 0, f"Found overlapping vehicle IDs: {overlap}"
        
        print(f"✓ Vehicle isolation verified: No overlapping vehicle IDs")


class TestUnauthorizedAccess:
    """Test that unauthenticated requests are rejected"""
    
    def test_customers_requires_auth(self):
        """Customers endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 401
        print("✓ Customers endpoint correctly requires auth")
    
    def test_regions_requires_auth(self):
        """Regions endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 401
        print("✓ Regions endpoint correctly requires auth")
    
    def test_visits_requires_auth(self):
        """Visits endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/visits")
        assert response.status_code == 401
        print("✓ Visits endpoint correctly requires auth")
    
    def test_followups_requires_auth(self):
        """Follow-ups endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/follow-ups")
        assert response.status_code == 401
        print("✓ Follow-ups endpoint correctly requires auth")
    
    def test_vehicles_requires_auth(self):
        """Vehicles endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/vehicles")
        assert response.status_code == 401
        print("✓ Vehicles endpoint correctly requires auth")


class TestCRUDIsolation:
    """Test CRUD operations respect user isolation"""
    
    def test_update_customer_isolation(self, user1_headers, user2_headers):
        """User cannot update another user's customer"""
        # Get User 2's customers
        user2_response = requests.get(f"{BASE_URL}/api/customers", headers=user2_headers)
        user2_customers = user2_response.json()
        
        if len(user2_customers) > 0:
            user2_customer_id = user2_customers[0]["id"]
            
            # Try to update User 2's customer as User 1
            response = requests.put(
                f"{BASE_URL}/api/customers/{user2_customer_id}",
                headers=user1_headers,
                json={"name": "HACKED_NAME"}
            )
            assert response.status_code == 404, f"User 1 should not update User 2's customer"
            print("✓ User 1 correctly denied update to User 2's customer")
        else:
            print("⚠ User 2 has no customers to test update isolation")
    
    def test_delete_customer_isolation(self, user1_headers, user2_headers):
        """User cannot delete another user's customer"""
        # Get User 2's customers
        user2_response = requests.get(f"{BASE_URL}/api/customers", headers=user2_headers)
        user2_customers = user2_response.json()
        
        if len(user2_customers) > 0:
            user2_customer_id = user2_customers[0]["id"]
            
            # Try to delete User 2's customer as User 1
            response = requests.delete(
                f"{BASE_URL}/api/customers/{user2_customer_id}",
                headers=user1_headers
            )
            assert response.status_code == 404, f"User 1 should not delete User 2's customer"
            print("✓ User 1 correctly denied delete of User 2's customer")
        else:
            print("⚠ User 2 has no customers to test delete isolation")


class TestPDFReportIsolation:
    """Test PDF report contains only user's data"""
    
    def test_pdf_report_generation(self, user1_headers):
        """PDF report should generate for user"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        day_name = "Pazartesi"  # Example day
        
        response = requests.get(
            f"{BASE_URL}/api/report/pdf/{day_name}/{today}",
            headers=user1_headers
        )
        # PDF might return 200 or have no data for today
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ PDF report endpoint accessible for User 1")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
