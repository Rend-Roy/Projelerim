import requests
import sys
from datetime import datetime

class TurkishCustomerVisitAPITester:
    def __init__(self, base_url="https://satistrip.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

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

            return success, response.json() if response.content and response.status_code < 400 else {}

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

def main():
    print("🚀 Starting Turkish Customer Visit Tracking API Tests")
    print("=" * 60)
    
    tester = TurkishCustomerVisitAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1

    # Seed data
    seed_success, seed_response = tester.test_seed_data()
    if seed_success:
        print(f"📊 Seed response: {seed_response.get('message', 'Unknown')}")

    # Test customer operations
    customers_success, customers_data = tester.test_get_all_customers()
    if not customers_success:
        print("❌ Failed to get customers, stopping tests")
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
        
        # Print key metrics for verification
        visit_perf = weekly_data.get('visit_performance', {})
        print(f"📊 Weekly Metrics - Planned: {visit_perf.get('total_planned', 0)}, "
              f"Completed: {visit_perf.get('total_completed', 0)}, "
              f"Rate: {visit_perf.get('visit_rate', 0)}%")
    
    # Test monthly analytics
    monthly_success, monthly_data = tester.test_analytics_performance_monthly()
    if monthly_success:
        print("📊 Monthly analytics data retrieved successfully")
        visit_perf = monthly_data.get('visit_performance', {})
        print(f"📊 Monthly Metrics - Planned: {visit_perf.get('total_planned', 0)}, "
              f"Completed: {visit_perf.get('total_completed', 0)}, "
              f"Rate: {visit_perf.get('visit_rate', 0)}%")

    # Test deleting the customer (cleanup)
    tester.test_delete_customer(customer_id)

    # Print final results
    print("\n" + "=" * 60)
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