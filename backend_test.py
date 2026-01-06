import requests
import sys
from datetime import datetime

class TurkishCustomerVisitAPITester:
    def __init__(self, base_url="https://ziyarettakip.preview.emergentagent.com/api"):
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
            # Test updating the visit
            tester.test_update_visit(visit_id)

    # Test getting all visits
    tester.test_get_visits()

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