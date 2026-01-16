import requests
import sys
from datetime import datetime
import time

class TurkishCustomerVisitAPITester:
    def __init__(self, base_url="https://satiskatalogu.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.auth_token = None  # FAZ 3.0: Store authentication token
        self.test_user_email = "test@example.com"
        self.test_user_password = "test123"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if auth is required and token is available
        if auth_required and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "details": f"Status: {response.status_code}"})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAILED", "details": f"Expected {expected_status}, got {response.status_code}"})

            return success, response.json() if response.content and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "details": str(e)})
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_seed_data(self):
        """Test seeding sample data"""
        success, response = self.run_test(
            "Seed Sample Data",
            "POST",
            "seed",
            200
        )
        return success, response

    def test_get_all_customers(self):
        """Test getting all customers"""
        success, response = self.run_test(
            "Get All Customers",
            "GET",
            "customers",
            200
        )
        return success, response

    def test_get_tuesday_customers(self):
        """Test getting customers for Tuesday (Salı)"""
        success, response = self.run_test(
            "Get Tuesday Customers",
            "GET",
            "customers/today/Salı",
            200
        )
        return success, response

    def test_create_customer(self):
        """Test creating a new customer"""
        customer_data = {
            "name": "Test Müşteri",
            "region": "Test Bölge",
            "phone": "0555 123 4567",
            "address": "Test Adres",
            "visit_days": ["Salı", "Perşembe"]
        }
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        return success, response

    def test_get_customer_by_id(self, customer_id):
        """Test getting a specific customer"""
        success, response = self.run_test(
            "Get Customer by ID",
            "GET",
            f"customers/{customer_id}",
            200
        )
        return success, response

    def test_update_customer(self, customer_id):
        """Test updating a customer"""
        update_data = {
            "name": "Updated Test Müşteri",
            "region": "Updated Test Bölge"
        }
        success, response = self.run_test(
            "Update Customer",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        return success, response

    def test_create_visit(self, customer_id):
        """Test creating/getting a visit"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Create/Get Visit",
            "POST",
            "visits",
            200,
            params={"customer_id": customer_id, "date": today_str}
        )
        return success, response

    def test_update_visit(self, visit_id):
        """Test updating a visit with new fields"""
        update_data = {
            "completed": True,
            "payment_collected": True,
            "payment_type": "Nakit",
            "payment_amount": 150.50,
            "customer_request": "Test müşteri talebi",
            "note": "Test ziyaret notu"
        }
        success, response = self.run_test(
            "Update Visit with New Fields",
            "PUT",
            f"visits/{visit_id}",
            200,
            data=update_data
        )
        return success, response

    def test_update_visit_not_completed(self, visit_id):
        """Test updating a visit as not completed with skip reason"""
        update_data = {
            "completed": False,
            "visit_skip_reason": "Müşteri yerinde değildi",
            "payment_collected": False,
            "payment_skip_reason": "Müşterinin ödeme gücü yok",
            "customer_request": "Gelecek hafta tekrar gel",
            "note": "Müşteri bulunamadı"
        }
        success, response = self.run_test(
            "Update Visit Not Completed",
            "PUT",
            f"visits/{visit_id}",
            200,
            data=update_data
        )
        return success, response

    def test_get_visits(self):
        """Test getting all visits"""
        success, response = self.run_test(
            "Get All Visits",
            "GET",
            "visits",
            200
        )
        return success, response

    def test_daily_note_get(self):
        """Test getting daily note"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Daily Note",
            "GET",
            f"daily-note/{today_str}",
            200
        )
        return success, response

    def test_daily_note_save(self):
        """Test saving daily note"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        note_data = {
            "note": "Test gün sonu notu - bugün 5 müşteri ziyaret edildi, genel durum iyi."
        }
        success, response = self.run_test(
            "Save Daily Note",
            "POST",
            f"daily-note/{today_str}",
            200,
            data=note_data
        )
        return success, response

    def test_pdf_report(self):
        """Test PDF report generation"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        # Get current day name in Turkish
        day_names = {
            0: "Pazartesi", 1: "Salı", 2: "Çarşamba", 3: "Perşembe", 
            4: "Cuma", 5: "Cumartesi", 6: "Pazar"
        }
        today_day = day_names[datetime.now().weekday()]
        
        success, response = self.run_test(
            "Generate PDF Report",
            "GET",
            f"report/pdf/{today_day}/{today_str}",
            200
        )
        return success, response

    def test_delete_customer(self, customer_id):
        """Test deleting a customer"""
        success, response = self.run_test(
            "Delete Customer",
            "DELETE",
            f"customers/{customer_id}",
            200
        )
        return success, response

    # Follow-Up CRUD Tests
    def test_create_follow_up(self, customer_id):
        """Test creating a follow-up"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        follow_up_data = {
            "customer_id": customer_id,
            "due_date": today_str,
            "due_time": "14:30",
            "reason": "Ürün tanıtımı",
            "note": "Yeni ürünleri göstermek için takip"
        }
        success, response = self.run_test(
            "Create Follow-Up",
            "POST",
            "follow-ups",
            200,
            data=follow_up_data
        )
        return success, response

    def test_get_follow_ups_by_date(self):
        """Test getting follow-ups for a specific date"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Follow-Ups by Date",
            "GET",
            "follow-ups",
            200,
            params={"date": today_str}
        )
        return success, response

    def test_complete_follow_up(self, follow_up_id):
        """Test completing a follow-up"""
        success, response = self.run_test(
            "Complete Follow-Up",
            "POST",
            f"follow-ups/{follow_up_id}/complete",
            200
        )
        return success, response

    def test_get_today_follow_ups(self):
        """Test getting today's follow-ups"""
        success, response = self.run_test(
            "Get Today Follow-Ups",
            "GET",
            "follow-ups/today",
            200
        )
        return success, response

    # Analytics Integration Tests
    def test_analytics_performance_weekly(self):
        """Test analytics performance endpoint with weekly period"""
        success, response = self.run_test(
            "Analytics Performance Weekly",
            "GET",
            "analytics/performance",
            200,
            params={"period": "weekly"}
        )
        return success, response

    def test_analytics_performance_monthly(self):
        """Test analytics performance endpoint with monthly period"""
        success, response = self.run_test(
            "Analytics Performance Monthly",
            "GET",
            "analytics/performance",
            200,
            params={"period": "monthly"}
        )
        return success, response

    # ===== FAZ 2: Visit Duration Tracking Tests =====
    def test_start_visit(self, visit_id):
        """Test starting a visit timer"""
        success, response = self.run_test(
            "Start Visit Timer",
            "POST",
            f"visits/{visit_id}/start",
            200
        )
        return success, response

    def test_start_visit_already_started(self, visit_id):
        """Test starting a visit that's already started (should fail)"""
        success, response = self.run_test(
            "Start Visit Already Started (Should Fail)",
            "POST",
            f"visits/{visit_id}/start",
            400
        )
        return success, response

    def test_end_visit(self, visit_id):
        """Test ending a visit timer"""
        success, response = self.run_test(
            "End Visit Timer",
            "POST",
            f"visits/{visit_id}/end",
            200
        )
        return success, response

    def test_end_visit_not_started(self, visit_id):
        """Test ending a visit that hasn't been started (should fail)"""
        success, response = self.run_test(
            "End Visit Not Started (Should Fail)",
            "POST",
            f"visits/{visit_id}/end",
            400
        )
        return success, response

    def test_end_visit_already_ended(self, visit_id):
        """Test ending a visit that's already ended (should fail)"""
        success, response = self.run_test(
            "End Visit Already Ended (Should Fail)",
            "POST",
            f"visits/{visit_id}/end",
            400
        )
        return success, response

    # ===== FAZ 2: Quality Rating Tests =====
    def test_update_visit_quality_rating(self, visit_id):
        """Test updating visit with quality rating"""
        update_data = {
            "quality_rating": 4
        }
        success, response = self.run_test(
            "Update Visit Quality Rating",
            "PUT",
            f"visits/{visit_id}",
            200,
            data=update_data
        )
        return success, response

    def test_update_visit_invalid_quality_rating(self, visit_id):
        """Test updating visit with invalid quality rating"""
        update_data = {
            "quality_rating": 6  # Should be 1-5
        }
        success, response = self.run_test(
            "Update Visit Invalid Quality Rating",
            "PUT",
            f"visits/{visit_id}",
            200,  # API might accept but should validate
            data=update_data
        )
        return success, response

    # ===== FAZ 2: Customer Alerts Tests =====
    def test_get_customer_alert_options(self):
        """Test getting customer alert options"""
        success, response = self.run_test(
            "Get Customer Alert Options",
            "GET",
            "customer-alerts",
            200
        )
        return success, response

    def test_update_customer_with_alerts(self, customer_id):
        """Test updating customer with alerts"""
        update_data = {
            "alerts": ["Geç öder", "Fiyat hassas"]
        }
        success, response = self.run_test(
            "Update Customer with Alerts",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        return success, response

    def test_update_customer_with_all_alerts(self, customer_id):
        """Test updating customer with all available alerts"""
        update_data = {
            "alerts": [
                "Geç öder",
                "Fiyat hassas", 
                "Belirli saatlerde",
                "Özel anlaşma var",
                "Tahsilat problemi var",
                "Sürekli erteleme yapıyor"
            ]
        }
        success, response = self.run_test(
            "Update Customer with All Alerts",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        return success, response

    def test_clear_customer_alerts(self, customer_id):
        """Test clearing customer alerts"""
        update_data = {
            "alerts": []
        }
        success, response = self.run_test(
            "Clear Customer Alerts",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        return success, response

    def validate_analytics_follow_up_integration(self, analytics_data):
        """Validate that analytics correctly integrates follow-up data"""
        print("\n🔍 Validating Analytics Follow-Up Integration...")
        
        visit_performance = analytics_data.get('visit_performance', {})
        total_planned = visit_performance.get('total_planned', 0)
        total_completed = visit_performance.get('total_completed', 0)
        visit_rate = visit_performance.get('visit_rate', 0)
        
        # Check if visit_performance data exists
        if total_planned == 0:
            print("⚠️  Warning: No planned visits found in analytics")
            return True  # This might be expected if no follow-ups exist
        
        # Validate visit rate calculation
        expected_rate = (total_completed / total_planned * 100) if total_planned > 0 else 0
        if abs(visit_rate - expected_rate) > 0.1:  # Allow small floating point differences
            print(f"❌ Visit rate calculation error: Expected {expected_rate:.1f}%, got {visit_rate}%")
            return False
        
        # Check daily breakdown
        daily_breakdown = analytics_data.get('daily_breakdown', [])
        if not daily_breakdown:
            print("❌ No daily breakdown data found")
            return False
        
        # Validate daily breakdown structure
        for day_data in daily_breakdown:
            required_fields = ['date', 'planned', 'completed']
            for field in required_fields:
                if field not in day_data:
                    print(f"❌ Missing field '{field}' in daily breakdown")
                    return False
        
        print("✅ Analytics follow-up integration validation passed")
        return True

    def validate_visit_duration_response(self, response, action):
        """Validate visit duration API responses"""
        print(f"\n🔍 Validating {action} visit response...")
        
        if action == "start":
            required_fields = ['message', 'started_at']
            expected_message = "Ziyaret başlatıldı"
        elif action == "end":
            required_fields = ['message', 'ended_at', 'duration_minutes']
            expected_message = "Ziyaret tamamlandı"
        else:
            return False
        
        # Check required fields
        for field in required_fields:
            if field not in response:
                print(f"❌ Missing field '{field}' in {action} response")
                return False
        
        # Check message
        if response.get('message') != expected_message:
            print(f"❌ Expected message '{expected_message}', got '{response.get('message')}'")
            return False
        
        # For end visit, validate duration is a positive integer
        if action == "end":
            duration = response.get('duration_minutes')
            if not isinstance(duration, int) or duration < 0:
                print(f"❌ Invalid duration_minutes: {duration}")
                return False
        
        print(f"✅ {action.capitalize()} visit response validation passed")
        return True

    def validate_customer_alerts_response(self, response):
        """Validate customer alerts API response"""
        print("\n🔍 Validating customer alerts response...")
        
        if 'alerts' not in response:
            print("❌ Missing 'alerts' field in response")
            return False
        
        alerts = response.get('alerts', [])
        expected_alerts = [
            "Geç öder",
            "Fiyat hassas",
            "Belirli saatlerde",
            "Özel anlaşma var",
            "Tahsilat problemi var",
            "Sürekli erteleme yapıyor"
        ]
        
        if len(alerts) != 6:
            print(f"❌ Expected 6 alerts, got {len(alerts)}")
            return False
        
        for expected_alert in expected_alerts:
            if expected_alert not in alerts:
                print(f"❌ Missing expected alert: {expected_alert}")
                return False
        
        print("✅ Customer alerts response validation passed")
        return True

    def validate_analytics_visit_quality(self, analytics_data):
        """Validate visit_quality object in analytics response"""
        print("\n🔍 Validating analytics visit_quality metrics...")
        
        visit_quality = analytics_data.get('visit_quality')
        if not visit_quality:
            print("❌ Missing 'visit_quality' object in analytics response")
            return False
        
        # Check duration object
        duration = visit_quality.get('duration')
        if not duration:
            print("❌ Missing 'duration' object in visit_quality")
            return False
        
        duration_fields = ['average_minutes', 'total_measured', 'short_visits', 'long_visits']
        for field in duration_fields:
            if field not in duration:
                print(f"❌ Missing field '{field}' in duration object")
                return False
        
        # Check rating object
        rating = visit_quality.get('rating')
        if not rating:
            print("❌ Missing 'rating' object in visit_quality")
            return False
        
        rating_fields = ['average_rating', 'total_rated', 'distribution', 'quality_payment_relation']
        for field in rating_fields:
            if field not in rating:
                print(f"❌ Missing field '{field}' in rating object")
                return False
        
        # Validate distribution has all rating levels
        distribution = rating.get('distribution', {})
        for i in range(1, 6):
            if str(i) not in distribution and i not in distribution:
                print(f"❌ Missing rating level {i} in distribution")
                return False
        
        print("✅ Analytics visit_quality validation passed")
        return True

    # ===== FAZ 3.0: AUTHENTICATION TESTS =====
    def test_register_new_user(self):
        """Test registering a new user"""
        register_data = {
            "email": f"newuser_{int(time.time())}@example.com",
            "password": "newpass123",
            "name": "Yeni Kullanıcı Test"
        }
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        return success, response

    def test_register_existing_email(self):
        """Test registering with existing email (should fail)"""
        register_data = {
            "email": self.test_user_email,
            "password": "test123",
            "name": "Test User"
        }
        success, response = self.run_test(
            "Register Existing Email (Should Fail)",
            "POST",
            "auth/register",
            400,
            data=register_data
        )
        return success, response

    def test_register_short_password(self):
        """Test registering with short password (should fail)"""
        register_data = {
            "email": f"shortpass_{int(time.time())}@example.com",
            "password": "123",  # Less than 6 characters
            "name": "Short Pass User"
        }
        success, response = self.run_test(
            "Register Short Password (Should Fail)",
            "POST",
            "auth/register",
            400,
            data=register_data
        )
        return success, response

    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "remember_me": True
        }
        success, response = self.run_test(
            "Login Valid Credentials",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        # Store token for authenticated requests
        if success and 'token' in response:
            self.auth_token = response['token']
            print(f"🔑 Auth token stored for subsequent tests")
        
        return success, response

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials (should fail)"""
        login_data = {
            "email": self.test_user_email,
            "password": "wrongpassword",
            "remember_me": False
        }
        success, response = self.run_test(
            "Login Invalid Credentials (Should Fail)",
            "POST",
            "auth/login",
            401,
            data=login_data
        )
        return success, response

    def test_login_nonexistent_user(self):
        """Test login with non-existent user (should fail)"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "somepassword",
            "remember_me": False
        }
        success, response = self.run_test(
            "Login Non-existent User (Should Fail)",
            "POST",
            "auth/login",
            401,
            data=login_data
        )
        return success, response

    def test_get_me_with_token(self):
        """Test getting current user info with valid token"""
        success, response = self.run_test(
            "Get Me With Token",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        return success, response

    def test_get_me_without_token(self):
        """Test getting current user info without token (should fail)"""
        success, response = self.run_test(
            "Get Me Without Token (Should Fail)",
            "GET",
            "auth/me",
            401
        )
        return success, response

    def test_logout_with_token(self):
        """Test logout with valid token"""
        success, response = self.run_test(
            "Logout With Token",
            "POST",
            "auth/logout",
            200,
            auth_required=True
        )
        return success, response

    def test_logout_without_token(self):
        """Test logout without token (should fail)"""
        success, response = self.run_test(
            "Logout Without Token (Should Fail)",
            "POST",
            "auth/logout",
            401
        )
        return success, response

    def test_forgot_password(self):
        """Test forgot password functionality (MOCK)"""
        forgot_data = {
            "email": self.test_user_email
        }
        success, response = self.run_test(
            "Forgot Password (MOCK)",
            "POST",
            "auth/forgot-password",
            200,
            data=forgot_data
        )
        return success, response

    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email (should still return success for security)"""
        forgot_data = {
            "email": "nonexistent@example.com"
        }
        success, response = self.run_test(
            "Forgot Password Non-existent Email",
            "POST",
            "auth/forgot-password",
            200,
            data=forgot_data
        )
        return success, response

    # ===== FAZ 3.0: BACKWARD COMPATIBILITY TESTS =====
    def test_backward_compatibility_customers_have_user_id(self):
        """Test that existing customers have user_id field"""
        success, customers = self.run_test(
            "Backward Compatibility - Customers Have user_id",
            "GET",
            "customers",
            200
        )
        
        if success and customers:
            # Check if first customer has user_id
            if len(customers) > 0:
                first_customer = customers[0]
                if 'user_id' in first_customer and first_customer['user_id']:
                    print(f"✅ First customer has user_id: {first_customer['user_id']}")
                    return True, customers
                else:
                    print(f"❌ First customer missing user_id: {first_customer}")
                    return False, customers
            else:
                print("⚠️ No customers found to check user_id")
                return True, customers  # Not a failure if no customers exist
        
        return success, customers

    def test_backward_compatibility_visits_have_user_id(self):
        """Test that existing visits have user_id field"""
        success, visits = self.run_test(
            "Backward Compatibility - Visits Have user_id",
            "GET",
            "visits",
            200
        )
        
        if success and visits:
            # Check if visits have user_id
            if len(visits) > 0:
                first_visit = visits[0]
                if 'user_id' in first_visit:
                    print(f"✅ First visit has user_id field: {first_visit.get('user_id', 'None')}")
                    return True, visits
                else:
                    print(f"❌ First visit missing user_id field: {first_visit}")
                    return False, visits
            else:
                print("⚠️ No visits found to check user_id")
                return True, visits
        
        return success, visits

    def test_backward_compatibility_follow_ups_have_user_id(self):
        """Test that existing follow-ups have user_id field"""
        success, follow_ups = self.run_test(
            "Backward Compatibility - Follow-ups Have user_id",
            "GET",
            "follow-ups",
            200
        )
        
        if success and follow_ups:
            # Check if follow-ups have user_id
            if len(follow_ups) > 0:
                first_follow_up = follow_ups[0]
                if 'user_id' in first_follow_up:
                    print(f"✅ First follow-up has user_id field: {first_follow_up.get('user_id', 'None')}")
                    return True, follow_ups
                else:
                    print(f"❌ First follow-up missing user_id field: {first_follow_up}")
                    return False, follow_ups
            else:
                print("⚠️ No follow-ups found to check user_id")
                return True, follow_ups
        
        return success, follow_ups

    def test_backward_compatibility_regions_work(self):
        """Test that regions endpoint still works"""
        success, regions = self.run_test(
            "Backward Compatibility - Regions Endpoint",
            "GET",
            "regions",
            200
        )
        return success, regions

    def test_backward_compatibility_analytics_work(self):
        """Test that analytics endpoint still works"""
        success, analytics = self.run_test(
            "Backward Compatibility - Analytics Performance",
            "GET",
            "analytics/performance",
            200,
            params={"period": "weekly"}
        )
        return success, analytics

    def test_backward_compatibility_customer_alerts_work(self):
        """Test that customer alerts endpoint still works"""
        success, alerts = self.run_test(
            "Backward Compatibility - Customer Alerts",
            "GET",
            "customer-alerts",
            200
        )
        return success, alerts

    def test_backward_compatibility_visits_today(self):
        """Test that visits for today endpoint works"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        success, visits = self.run_test(
            "Backward Compatibility - Visits Today",
            "GET",
            "visits",
            200,
            params={"date": today_str}
        )
        return success, visits

    def test_backward_compatibility_follow_ups_today(self):
        """Test that follow-ups for today endpoint works"""
        today_str = datetime.now().strftime("%Y-%m-%d")
        success, follow_ups = self.run_test(
            "Backward Compatibility - Follow-ups Today",
            "GET",
            "follow-ups",
            200,
            params={"date": today_str}
        )
        return success, follow_ups

    def validate_auth_response(self, response, action):
        """Validate authentication API responses"""
        print(f"\n🔍 Validating {action} response...")
        
        if action == "register" or action == "login":
            required_fields = ['message', 'token', 'user']
            user_fields = ['id', 'email', 'name', 'role']
            
            # Check main fields
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in {action} response")
                    return False
            
            # Check user object fields
            user = response.get('user', {})
            for field in user_fields:
                if field not in user:
                    print(f"❌ Missing field '{field}' in user object")
                    return False
            
            # Check token is not empty
            if not response.get('token'):
                print(f"❌ Empty token in {action} response")
                return False
                
        elif action == "me":
            user_fields = ['id', 'email', 'name', 'role']
            for field in user_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in me response")
                    return False
                    
        elif action == "logout":
            if 'message' not in response:
                print(f"❌ Missing message field in logout response")
                return False
                
        elif action == "forgot-password":
            if 'message' not in response:
                print(f"❌ Missing message field in forgot-password response")
                return False
        
        print(f"✅ {action.capitalize()} response validation passed")
        return True

    # ===== FAZ 4: VEHICLE, FUEL AND DAILY KM TRACKING TESTS =====
    
    def test_get_fuel_types(self):
        """Test getting fuel types"""
        success, response = self.run_test(
            "Get Fuel Types",
            "GET",
            "fuel-types",
            200
        )
        return success, response
    
    def validate_fuel_types_response(self, response):
        """Validate fuel types API response"""
        print("\n🔍 Validating fuel types response...")
        
        if 'fuel_types' not in response:
            print("❌ Missing 'fuel_types' field in response")
            return False
        
        fuel_types = response.get('fuel_types', [])
        expected_types = ["Benzin", "Dizel", "LPG", "Elektrik", "Hibrit"]
        
        if len(fuel_types) != 5:
            print(f"❌ Expected 5 fuel types, got {len(fuel_types)}")
            return False
        
        for expected_type in expected_types:
            if expected_type not in fuel_types:
                print(f"❌ Missing expected fuel type: {expected_type}")
                return False
        
        print("✅ Fuel types response validation passed")
        return True

    # ===== VEHICLE CRUD TESTS =====
    
    def test_get_vehicles(self):
        """Test getting user's vehicles"""
        success, response = self.run_test(
            "Get User Vehicles",
            "GET",
            "vehicles",
            200,
            auth_required=True
        )
        return success, response
    
    def test_get_active_vehicle(self):
        """Test getting active vehicle"""
        success, response = self.run_test(
            "Get Active Vehicle",
            "GET",
            "vehicles/active",
            200,
            auth_required=True
        )
        return success, response
    
    def test_create_vehicle(self):
        """Test creating a new vehicle"""
        vehicle_data = {
            "name": "Test Araç",
            "plate": "34 TEST 123",
            "fuel_type": "Benzin",
            "starting_km": 50000,
            "is_active": True
        }
        success, response = self.run_test(
            "Create Vehicle",
            "POST",
            "vehicles",
            200,
            data=vehicle_data,
            auth_required=True
        )
        return success, response
    
    def test_get_vehicle_by_id(self, vehicle_id):
        """Test getting a specific vehicle"""
        success, response = self.run_test(
            "Get Vehicle by ID",
            "GET",
            f"vehicles/{vehicle_id}",
            200,
            auth_required=True
        )
        return success, response
    
    def test_update_vehicle(self, vehicle_id):
        """Test updating a vehicle"""
        update_data = {
            "name": "Updated Test Araç",
            "fuel_type": "Dizel",
            "is_active": True
        }
        success, response = self.run_test(
            "Update Vehicle",
            "PUT",
            f"vehicles/{vehicle_id}",
            200,
            data=update_data,
            auth_required=True
        )
        return success, response
    
    def test_delete_vehicle(self, vehicle_id):
        """Test deleting a vehicle"""
        success, response = self.run_test(
            "Delete Vehicle",
            "DELETE",
            f"vehicles/{vehicle_id}",
            200,
            auth_required=True
        )
        return success, response
    
    def validate_vehicle_response(self, response, action="get"):
        """Validate vehicle API responses"""
        print(f"\n🔍 Validating vehicle {action} response...")
        
        if action == "create" or action == "get" or action == "update":
            required_fields = ['id', 'user_id', 'name', 'fuel_type', 'starting_km', 'is_active']
            
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in vehicle response")
                    return False
            
            # Validate fuel_type is valid
            valid_fuel_types = ["Benzin", "Dizel", "LPG", "Elektrik", "Hibrit"]
            if response.get('fuel_type') not in valid_fuel_types:
                print(f"❌ Invalid fuel_type: {response.get('fuel_type')}")
                return False
                
        elif action == "delete":
            if 'message' not in response:
                print(f"❌ Missing message field in delete response")
                return False
        
        print(f"✅ Vehicle {action} response validation passed")
        return True

    # ===== FUEL RECORDS TESTS =====
    
    def test_get_fuel_records(self, vehicle_id=None):
        """Test getting fuel records"""
        params = {}
        if vehicle_id:
            params['vehicle_id'] = vehicle_id
            
        success, response = self.run_test(
            "Get Fuel Records",
            "GET",
            "fuel-records",
            200,
            params=params,
            auth_required=True
        )
        return success, response
    
    def test_create_fuel_record(self, vehicle_id):
        """Test creating a fuel record"""
        fuel_data = {
            "vehicle_id": vehicle_id,
            "date": "2024-01-15",
            "current_km": 51000,
            "liters": 45.5,
            "amount": 850.75,
            "note": "Test yakıt kaydı"
        }
        success, response = self.run_test(
            "Create Fuel Record",
            "POST",
            "fuel-records",
            200,
            data=fuel_data,
            auth_required=True
        )
        return success, response
    
    def test_delete_fuel_record(self, record_id):
        """Test deleting a fuel record"""
        success, response = self.run_test(
            "Delete Fuel Record",
            "DELETE",
            f"fuel-records/{record_id}",
            200,
            auth_required=True
        )
        return success, response
    
    def validate_fuel_record_response(self, response, action="get"):
        """Validate fuel record API responses"""
        print(f"\n🔍 Validating fuel record {action} response...")
        
        if action == "create" or action == "get":
            required_fields = ['id', 'user_id', 'vehicle_id', 'date', 'current_km', 'liters', 'amount']
            calculated_fields = ['distance_since_last', 'consumption_per_100km', 'cost_per_km']
            
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in fuel record response")
                    return False
            
            # Check that calculated fields exist (can be None for first record)
            for field in calculated_fields:
                if field not in response:
                    print(f"❌ Missing calculated field '{field}' in fuel record response")
                    return False
                    
        elif action == "delete":
            if 'message' not in response:
                print(f"❌ Missing message field in delete response")
                return False
        
        print(f"✅ Fuel record {action} response validation passed")
        return True

    # ===== DAILY KM TESTS =====
    
    def test_get_daily_km_records(self, vehicle_id=None):
        """Test getting daily KM records"""
        params = {}
        if vehicle_id:
            params['vehicle_id'] = vehicle_id
            
        success, response = self.run_test(
            "Get Daily KM Records",
            "GET",
            "daily-km",
            200,
            params=params,
            auth_required=True
        )
        return success, response
    
    def test_get_today_km(self):
        """Test getting today's KM record"""
        success, response = self.run_test(
            "Get Today KM Record",
            "GET",
            "daily-km/today",
            200,
            auth_required=True
        )
        return success, response
    
    def test_create_daily_km_record(self, vehicle_id):
        """Test creating a daily KM record"""
        km_data = {
            "vehicle_id": vehicle_id,
            "date": "2024-01-15",
            "start_km": 51000,
            "end_km": 51150
        }
        success, response = self.run_test(
            "Create Daily KM Record",
            "POST",
            "daily-km",
            200,
            data=km_data,
            auth_required=True
        )
        return success, response
    
    def test_update_daily_km_record(self, record_id):
        """Test updating a daily KM record"""
        update_data = {
            "end_km": 51200
        }
        success, response = self.run_test(
            "Update Daily KM Record",
            "PUT",
            f"daily-km/{record_id}",
            200,
            data=update_data,
            auth_required=True
        )
        return success, response
    
    def validate_daily_km_response(self, response, action="get"):
        """Validate daily KM API responses"""
        print(f"\n🔍 Validating daily KM {action} response...")
        
        if action == "create" or action == "get" or action == "update":
            required_fields = ['id', 'user_id', 'vehicle_id', 'date', 'start_km']
            calculated_fields = ['daily_km', 'avg_cost_per_km', 'daily_cost']
            
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in daily KM response")
                    return False
            
            # Check that calculated fields exist (can be None)
            for field in calculated_fields:
                if field not in response:
                    print(f"❌ Missing calculated field '{field}' in daily KM response")
                    return False
        
        print(f"✅ Daily KM {action} response validation passed")
        return True

    # ===== VEHICLE STATS TESTS =====
    
    def test_get_vehicle_stats(self, vehicle_id):
        """Test getting vehicle statistics"""
        success, response = self.run_test(
            "Get Vehicle Stats",
            "GET",
            f"vehicle-stats/{vehicle_id}",
            200,
            auth_required=True
        )
        return success, response
    
    def validate_vehicle_stats_response(self, response):
        """Validate vehicle stats API response"""
        print("\n🔍 Validating vehicle stats response...")
        
        required_fields = ['vehicle', 'total_fuel_cost', 'monthly_fuel_cost', 'total_liters', 'avg_cost_per_km', 'avg_consumption_per_100km']
        
        for field in required_fields:
            if field not in response:
                print(f"❌ Missing field '{field}' in vehicle stats response")
                return False
        
        # Check vehicle object
        vehicle = response.get('vehicle', {})
        if not vehicle or 'id' not in vehicle:
            print("❌ Invalid vehicle object in stats response")
            return False
        
        print("✅ Vehicle stats response validation passed")
        return True

def main():
    print("🚀 Starting Turkish Customer Visit Tracking API Tests - FAZ 4")
    print("=" * 70)
    
    tester = TurkishCustomerVisitAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1

    # ===== FAZ 3.0: AUTHENTICATION TESTS =====
    print("\n🔐 Testing FAZ 3.0: Authentication System...")
    
    # Test user registration
    print("\n📝 Testing User Registration...")
    
    # Test registering new user
    reg_success, reg_response = tester.test_register_new_user()
    if reg_success:
        if tester.validate_auth_response(reg_response, "register"):
            print("✅ User registration working correctly")
    
    # Test registration edge cases
    tester.test_register_existing_email()
    tester.test_register_short_password()
    
    # Test user login
    print("\n🔑 Testing User Login...")
    
    # First, ensure test user exists by trying to register
    test_register_data = {
        "email": tester.test_user_email,
        "password": tester.test_user_password,
        "name": "Test User"
    }
    test_reg_success, test_reg_response = tester.run_test(
        "Ensure Test User Exists",
        "POST",
        "auth/register",
        200,  # Will succeed if user doesn't exist
        data=test_register_data
    )
    # Ignore if it fails (user already exists)
    
    # Test valid login
    login_success, login_response = tester.test_login_valid_credentials()
    if login_success:
        if tester.validate_auth_response(login_response, "login"):
            print("✅ User login working correctly")
    
    # Test login edge cases
    tester.test_login_invalid_credentials()
    tester.test_login_nonexistent_user()
    
    # Test authenticated endpoints
    print("\n👤 Testing Authenticated Endpoints...")
    
    # Test /auth/me endpoint
    me_success, me_response = tester.test_get_me_with_token()
    if me_success:
        if tester.validate_auth_response(me_response, "me"):
            print("✅ Get current user info working correctly")
    
    # Test /auth/me without token
    tester.test_get_me_without_token()
    
    # Test logout
    logout_success, logout_response = tester.test_logout_with_token()
    if logout_success:
        if tester.validate_auth_response(logout_response, "logout"):
            print("✅ User logout working correctly")
    
    # Test logout without token
    tester.test_logout_without_token()
    
    # Test forgot password
    print("\n🔄 Testing Password Reset...")
    
    forgot_success, forgot_response = tester.test_forgot_password()
    if forgot_success:
        if tester.validate_auth_response(forgot_response, "forgot-password"):
            print("✅ Forgot password (MOCK) working correctly")
            print("📧 Check console for MOCK reset token output")
    
    # Test forgot password with non-existent email
    tester.test_forgot_password_nonexistent_email()

    # ===== FAZ 3.0: BACKWARD COMPATIBILITY TESTS =====
    print("\n🔄 Testing FAZ 3.0: Backward Compatibility...")
    
    # Seed data first to ensure we have test data
    seed_success, seed_response = tester.test_seed_data()
    if seed_success:
        print(f"📊 Seed response: {seed_response.get('message', 'Unknown')}")

    # Test that existing data has user_id fields
    print("\n📊 Testing Data Migration (user_id fields)...")
    
    tester.test_backward_compatibility_customers_have_user_id()
    tester.test_backward_compatibility_visits_have_user_id()
    tester.test_backward_compatibility_follow_ups_have_user_id()
    
    # Test that all existing features still work
    print("\n🔧 Testing Existing Features Still Work...")
    
    tester.test_backward_compatibility_regions_work()
    tester.test_backward_compatibility_analytics_work()
    tester.test_backward_compatibility_customer_alerts_work()
    tester.test_backward_compatibility_visits_today()
    tester.test_backward_compatibility_follow_ups_today()

    # ===== EXISTING FEATURE TESTS (CRUD Operations) =====
    print("\n🔧 Testing CRUD Operations Still Work...")

    # Test customer operations
    customers_success, customers_data = tester.test_get_all_customers()
    if not customers_success:
        print("❌ Failed to get customers, stopping CRUD tests")
        return 1

    print(f"📊 Found {len(customers_data)} customers")

    # Test Tuesday customers (Salı)
    tuesday_success, tuesday_customers = tester.test_get_tuesday_customers()
    if tuesday_success:
        print(f"📊 Found {len(tuesday_customers)} customers for Tuesday")

    # Test creating a new customer
    create_success, new_customer = tester.test_create_customer()
    if not create_success:
        print("❌ Failed to create customer")
        return 1

    customer_id = new_customer.get('id')
    if not customer_id:
        print("❌ No customer ID returned")
        return 1

    # Test getting the created customer
    get_success, _ = tester.test_get_customer_by_id(customer_id)
    
    # Test updating the customer
    update_success, _ = tester.test_update_customer(customer_id)

    # Test visit operations
    visit_success, visit_data = tester.test_create_visit(customer_id)
    if visit_success:
        visit_id = visit_data.get('id')
        if visit_id:
            # Test updating the visit with new fields
            tester.test_update_visit(visit_id)
            # Test updating visit as not completed
            tester.test_update_visit_not_completed(visit_id)

    # Test getting all visits
    tester.test_get_visits()

    # Test daily note functionality
    tester.test_daily_note_get()
    tester.test_daily_note_save()
    
    # Test PDF report generation
    tester.test_pdf_report()

    # ===== NEW FOLLOW-UP TESTS =====
    print("\n🔄 Testing Follow-Up Module...")
    
    # Test creating a follow-up
    follow_up_success, follow_up_data = tester.test_create_follow_up(customer_id)
    follow_up_id = None
    if follow_up_success:
        follow_up_id = follow_up_data.get('id')
        print(f"📊 Created follow-up with ID: {follow_up_id}")
        
        # Validate follow-up response structure
        required_fields = ['id', 'customer_id', 'due_date', 'status']
        for field in required_fields:
            if field not in follow_up_data:
                print(f"❌ Missing required field '{field}' in follow-up response")
            elif field == 'status' and follow_up_data[field] != 'pending':
                print(f"❌ Expected status 'pending', got '{follow_up_data[field]}'")
    
    # Test getting follow-ups by date
    date_follow_ups_success, date_follow_ups_data = tester.test_get_follow_ups_by_date()
    if date_follow_ups_success:
        print(f"📊 Found {len(date_follow_ups_data)} follow-ups for today")
    
    # Test getting today's follow-ups
    today_follow_ups_success, today_follow_ups_data = tester.test_get_today_follow_ups()
    if today_follow_ups_success:
        print(f"📊 Found {len(today_follow_ups_data)} follow-ups for today (with customer info)")
    
    # Test completing a follow-up
    if follow_up_id:
        complete_success, complete_response = tester.test_complete_follow_up(follow_up_id)
        if complete_success:
            expected_message = "Takip tamamlandı"
            if complete_response.get('message') == expected_message:
                print(f"✅ Follow-up completion message correct: {expected_message}")
            else:
                print(f"❌ Expected message '{expected_message}', got '{complete_response.get('message')}'")

    # ===== ANALYTICS INTEGRATION TESTS =====
    print("\n📊 Testing Analytics Integration...")
    
    # Test weekly analytics
    weekly_success, weekly_data = tester.test_analytics_performance_weekly()
    if weekly_success:
        print("📊 Weekly analytics data retrieved successfully")
        
        # Validate analytics structure and follow-up integration
        if not tester.validate_analytics_follow_up_integration(weekly_data):
            print("❌ Analytics follow-up integration validation failed")
        
        # FAZ 2: Validate visit_quality metrics
        if not tester.validate_analytics_visit_quality(weekly_data):
            print("❌ Analytics visit_quality validation failed")
        
        # Print key metrics for verification
        visit_perf = weekly_data.get('visit_performance', {})
        print(f"📊 Weekly Metrics - Planned: {visit_perf.get('total_planned', 0)}, "
              f"Completed: {visit_perf.get('total_completed', 0)}, "
              f"Rate: {visit_perf.get('visit_rate', 0)}%")
        
        # FAZ 2: Print visit quality metrics
        visit_quality = weekly_data.get('visit_quality', {})
        duration = visit_quality.get('duration', {})
        rating = visit_quality.get('rating', {})
        print(f"📊 Visit Quality - Avg Duration: {duration.get('average_minutes', 'N/A')} min, "
              f"Avg Rating: {rating.get('average_rating', 'N/A')}/5, "
              f"Short Visits: {duration.get('short_visits', 0)}, "
              f"Long Visits: {duration.get('long_visits', 0)}")
    
    # Test monthly analytics
    monthly_success, monthly_data = tester.test_analytics_performance_monthly()
    if monthly_success:
        print("📊 Monthly analytics data retrieved successfully")
        visit_perf = monthly_data.get('visit_performance', {})
        print(f"📊 Monthly Metrics - Planned: {visit_perf.get('total_planned', 0)}, "
              f"Completed: {visit_perf.get('total_completed', 0)}, "
              f"Rate: {visit_perf.get('visit_rate', 0)}%")

    # ===== FAZ 2: VISIT DURATION TRACKING TESTS =====
    print("\n⏱️  Testing FAZ 2: Visit Duration Tracking...")
    
    if visit_id:
        # Test starting a visit
        start_success, start_response = tester.test_start_visit(visit_id)
        if start_success:
            if tester.validate_visit_duration_response(start_response, "start"):
                print("✅ Visit start functionality working correctly")
            
            # Test starting already started visit (should fail)
            tester.test_start_visit_already_started(visit_id)
            
            # Test ending the visit
            end_success, end_response = tester.test_end_visit(visit_id)
            if end_success:
                if tester.validate_visit_duration_response(end_response, "end"):
                    print("✅ Visit end functionality working correctly")
                
                # Test ending already ended visit (should fail)
                tester.test_end_visit_already_ended(visit_id)
        
        # Create a new visit for testing end without start
        new_visit_success, new_visit_data = tester.test_create_visit(customer_id)
        if new_visit_success:
            new_visit_id = new_visit_data.get('id')
            if new_visit_id:
                # Test ending visit that hasn't been started (should fail)
                tester.test_end_visit_not_started(new_visit_id)

    # ===== FAZ 2: QUALITY RATING TESTS =====
    print("\n⭐ Testing FAZ 2: Quality Rating...")
    
    if visit_id:
        # Test updating visit with quality rating
        quality_success, quality_response = tester.test_update_visit_quality_rating(visit_id)
        if quality_success:
            if quality_response.get('quality_rating') == 4:
                print("✅ Quality rating update working correctly")
            else:
                print(f"❌ Quality rating not saved correctly: {quality_response.get('quality_rating')}")
        
        # Test invalid quality rating
        tester.test_update_visit_invalid_quality_rating(visit_id)

    # ===== FAZ 2: CUSTOMER ALERTS TESTS =====
    print("\n🚨 Testing FAZ 2: Customer Alerts...")
    
    # Test getting customer alert options
    alerts_success, alerts_response = tester.test_get_customer_alert_options()
    if alerts_success:
        if tester.validate_customer_alerts_response(alerts_response):
            print("✅ Customer alert options working correctly")
    
    # Test updating customer with alerts
    if customer_id:
        # Test with some alerts
        alerts_update_success, alerts_update_response = tester.test_update_customer_with_alerts(customer_id)
        if alerts_update_success:
            saved_alerts = alerts_update_response.get('alerts', [])
            expected_alerts = ["Geç öder", "Fiyat hassas"]
            if set(saved_alerts) == set(expected_alerts):
                print("✅ Customer alerts update working correctly")
            else:
                print(f"❌ Customer alerts not saved correctly: {saved_alerts}")
        
        # Test with all alerts
        tester.test_update_customer_with_all_alerts(customer_id)
        
        # Test clearing alerts
        clear_success, clear_response = tester.test_clear_customer_alerts(customer_id)
        if clear_success:
            if clear_response.get('alerts') == []:
                print("✅ Customer alerts clearing working correctly")
            else:
                print(f"❌ Customer alerts not cleared: {clear_response.get('alerts')}")

    # Test deleting the customer (cleanup)
    tester.test_delete_customer(customer_id)

    # ===== FAZ 4: VEHICLE, FUEL AND DAILY KM TRACKING TESTS =====
    print("\n🚗 Testing FAZ 4: Vehicle, Fuel and Daily KM Tracking...")
    
    # Test fuel types
    print("\n⛽ Testing Fuel Types...")
    fuel_types_success, fuel_types_response = tester.test_get_fuel_types()
    if fuel_types_success:
        if tester.validate_fuel_types_response(fuel_types_response):
            print("✅ Fuel types endpoint working correctly")
    
    # Test vehicle CRUD operations
    print("\n🚗 Testing Vehicle CRUD Operations...")
    
    # Get existing vehicles
    vehicles_success, vehicles_response = tester.test_get_vehicles()
    if vehicles_success:
        print(f"📊 Found {len(vehicles_response)} existing vehicles")
    
    # Test creating a vehicle
    create_vehicle_success, create_vehicle_response = tester.test_create_vehicle()
    vehicle_id = None
    if create_vehicle_success:
        if tester.validate_vehicle_response(create_vehicle_response, "create"):
            vehicle_id = create_vehicle_response.get('id')
            print(f"✅ Vehicle created successfully with ID: {vehicle_id}")
    
    if vehicle_id:
        # Test getting vehicle by ID
        get_vehicle_success, get_vehicle_response = tester.test_get_vehicle_by_id(vehicle_id)
        if get_vehicle_success:
            if tester.validate_vehicle_response(get_vehicle_response, "get"):
                print("✅ Get vehicle by ID working correctly")
        
        # Test updating vehicle
        update_vehicle_success, update_vehicle_response = tester.test_update_vehicle(vehicle_id)
        if update_vehicle_success:
            if tester.validate_vehicle_response(update_vehicle_response, "update"):
                print("✅ Vehicle update working correctly")
        
        # Test getting active vehicle
        active_vehicle_success, active_vehicle_response = tester.test_get_active_vehicle()
        if active_vehicle_success:
            if active_vehicle_response and 'id' in active_vehicle_response:
                print("✅ Get active vehicle working correctly")
            elif active_vehicle_response is None:
                print("⚠️ No active vehicle found (this is acceptable)")
            else:
                print("❌ Invalid active vehicle response")
    
    # Test fuel records
    print("\n⛽ Testing Fuel Records...")
    
    if vehicle_id:
        # Test creating fuel record
        create_fuel_success, create_fuel_response = tester.test_create_fuel_record(vehicle_id)
        fuel_record_id = None
        if create_fuel_success:
            if tester.validate_fuel_record_response(create_fuel_response, "create"):
                fuel_record_id = create_fuel_response.get('id')
                print("✅ Fuel record created successfully")
                
                # Check calculated fields
                distance = create_fuel_response.get('distance_since_last')
                consumption = create_fuel_response.get('consumption_per_100km')
                cost_per_km = create_fuel_response.get('cost_per_km')
                print(f"📊 Calculated fields - Distance: {distance}, Consumption: {consumption}, Cost/km: {cost_per_km}")
        
        # Test getting fuel records
        get_fuel_success, get_fuel_response = tester.test_get_fuel_records(vehicle_id)
        if get_fuel_success:
            print(f"📊 Found {len(get_fuel_response)} fuel records for vehicle")
        
        # Test getting all fuel records
        get_all_fuel_success, get_all_fuel_response = tester.test_get_fuel_records()
        if get_all_fuel_success:
            print(f"📊 Found {len(get_all_fuel_response)} total fuel records")
        
        # Test deleting fuel record
        if fuel_record_id:
            delete_fuel_success, delete_fuel_response = tester.test_delete_fuel_record(fuel_record_id)
            if delete_fuel_success:
                if tester.validate_fuel_record_response(delete_fuel_response, "delete"):
                    print("✅ Fuel record deletion working correctly")
    
    # Test daily KM records
    print("\n📏 Testing Daily KM Records...")
    
    if vehicle_id:
        # Test creating daily KM record
        create_km_success, create_km_response = tester.test_create_daily_km_record(vehicle_id)
        km_record_id = None
        if create_km_success:
            if tester.validate_daily_km_response(create_km_response, "create"):
                km_record_id = create_km_response.get('id')
                print("✅ Daily KM record created successfully")
                
                # Check calculated fields
                daily_km = create_km_response.get('daily_km')
                avg_cost = create_km_response.get('avg_cost_per_km')
                daily_cost = create_km_response.get('daily_cost')
                print(f"📊 Calculated fields - Daily KM: {daily_km}, Avg Cost/km: {avg_cost}, Daily Cost: {daily_cost}")
        
        # Test updating daily KM record
        if km_record_id:
            update_km_success, update_km_response = tester.test_update_daily_km_record(km_record_id)
            if update_km_success:
                if tester.validate_daily_km_response(update_km_response, "update"):
                    print("✅ Daily KM record update working correctly")
        
        # Test getting daily KM records
        get_km_success, get_km_response = tester.test_get_daily_km_records(vehicle_id)
        if get_km_success:
            print(f"📊 Found {len(get_km_response)} daily KM records for vehicle")
        
        # Test getting today's KM record
        today_km_success, today_km_response = tester.test_get_today_km()
        if today_km_success:
            if today_km_response:
                print("✅ Today's KM record retrieved successfully")
            else:
                print("⚠️ No KM record for today (this is acceptable)")
    
    # Test vehicle stats
    print("\n📊 Testing Vehicle Statistics...")
    
    if vehicle_id:
        stats_success, stats_response = tester.test_get_vehicle_stats(vehicle_id)
        if stats_success:
            if tester.validate_vehicle_stats_response(stats_response):
                print("✅ Vehicle statistics working correctly")
                
                # Print key stats
                total_cost = stats_response.get('total_fuel_cost', 0)
                monthly_cost = stats_response.get('monthly_fuel_cost', 0)
                total_liters = stats_response.get('total_liters', 0)
                avg_cost_km = stats_response.get('avg_cost_per_km', 0)
                avg_consumption = stats_response.get('avg_consumption_per_100km', 0)
                
                print(f"📊 Vehicle Stats - Total Cost: {total_cost} TL, Monthly: {monthly_cost} TL")
                print(f"📊 Total Liters: {total_liters}, Avg Cost/km: {avg_cost_km}, Avg Consumption: {avg_consumption}")
    
    # Test backward compatibility
    print("\n🔄 Testing FAZ 4 Backward Compatibility...")
    
    # Test that existing endpoints still work
    compat_customers_success, _ = tester.test_get_all_customers()
    if compat_customers_success:
        print("✅ Customers endpoint still working")
    
    compat_visits_success, _ = tester.test_get_visits()
    if compat_visits_success:
        print("✅ Visits endpoint still working")
    
    compat_follow_ups_success, _ = tester.test_get_follow_ups_by_date()
    if compat_follow_ups_success:
        print("✅ Follow-ups endpoint still working")
    
    compat_analytics_success, _ = tester.test_analytics_performance_weekly()
    if compat_analytics_success:
        print("✅ Analytics performance endpoint still working")
    
    # Clean up test vehicle
    if vehicle_id:
        delete_vehicle_success, delete_vehicle_response = tester.test_delete_vehicle(vehicle_id)
        if delete_vehicle_success:
            if tester.validate_vehicle_response(delete_vehicle_response, "delete"):
                print("✅ Vehicle deletion working correctly")

    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        failed_tests = [t for t in tester.test_results if t['status'] != 'PASSED']
        for test in failed_tests:
            print(f"  - {test['test']}: {test['details']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())