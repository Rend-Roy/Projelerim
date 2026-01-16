"""
FAZ 5 - Ürün Kataloğu & Saha Sunum Modülü Test Suite
Tests for:
- Category CRUD endpoints
- Product CRUD endpoints
- Product listing with pagination and filtering
- Product code uniqueness validation
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fieldforce-app-6.preview.emergentagent.com')

class TestAuth:
    """Authentication helper tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


class TestCategoryCRUD(TestAuth):
    """Category CRUD endpoint tests"""
    
    def test_get_categories_requires_auth(self):
        """Test that categories endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 401, "Categories should require auth"
    
    def test_get_categories_success(self, auth_headers):
        """Test getting categories list"""
        response = requests.get(f"{BASE_URL}/api/categories", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Categories should return a list"
    
    def test_create_category_success(self, auth_headers):
        """Test creating a new category"""
        unique_name = f"TEST_Category_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Test category description"
            }
        )
        assert response.status_code == 200, f"Create category failed: {response.text}"
        data = response.json()
        # Response format: {"message": "...", "category": {...}}
        assert "category" in data, f"Response should have category key: {data}"
        category = data["category"]
        assert category["name"] == unique_name
        assert "id" in category
        
        # Cleanup - delete the test category
        requests.delete(f"{BASE_URL}/api/categories/{category['id']}", headers=auth_headers)
    
    def test_create_duplicate_category_fails(self, auth_headers):
        """Test that duplicate category names are rejected"""
        unique_name = f"TEST_DupCat_{uuid.uuid4().hex[:8]}"
        
        # Create first category
        response1 = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_name}
        )
        assert response1.status_code == 200
        cat_id = response1.json()["category"]["id"]
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_name}
        )
        assert response2.status_code == 400, "Duplicate category should fail"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)
    
    def test_update_category_success(self, auth_headers):
        """Test updating a category"""
        # Create category
        unique_name = f"TEST_UpdateCat_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_name}
        )
        assert create_response.status_code == 200
        cat_id = create_response.json()["category"]["id"]
        
        # Update category
        new_name = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        update_response = requests.put(f"{BASE_URL}/api/categories/{cat_id}", 
            headers=auth_headers,
            json={"name": new_name, "description": "Updated description"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == new_name
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)
    
    def test_delete_category_success(self, auth_headers):
        """Test deleting a category"""
        # Create category
        unique_name = f"TEST_DeleteCat_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_name}
        )
        assert create_response.status_code == 200
        cat_id = create_response.json()["category"]["id"]
        
        # Delete category
        delete_response = requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/categories", headers=auth_headers)
        categories = get_response.json()
        assert not any(c["id"] == cat_id for c in categories), "Category should be deleted"


class TestProductCRUD(TestAuth):
    """Product CRUD endpoint tests"""
    
    @pytest.fixture(scope="class")
    def test_category(self, auth_headers):
        """Create a test category for product tests"""
        unique_name = f"TEST_ProductCat_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_name}
        )
        assert response.status_code == 200
        category = response.json()["category"]
        yield category
        # Cleanup
        requests.delete(f"{BASE_URL}/api/categories/{category['id']}", headers=auth_headers)
    
    def test_get_products_requires_auth(self):
        """Test that products endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 401, "Products should require auth"
    
    def test_get_products_success(self, auth_headers):
        """Test getting products list with pagination"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "products" in data, "Response should have products key"
        assert "total" in data, "Response should have total key"
        assert isinstance(data["products"], list)
    
    def test_create_product_success(self, auth_headers, test_category):
        """Test creating a new product"""
        unique_code = f"TEST_PRD_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Test Product",
                "category": test_category["name"],
                "base_price": 99.99,
                "unit": "Adet",
                "description": "Test product description"
            }
        )
        assert response.status_code == 200, f"Create product failed: {response.text}"
        data = response.json()
        # Response format: {"message": "...", "product": {...}}
        assert "product" in data, f"Response should have product key: {data}"
        product = data["product"]
        assert product["product_code"] == unique_code
        assert product["name"] == "Test Product"
        assert product["base_price"] == 99.99
        assert "id" in product
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product['id']}", headers=auth_headers)
    
    def test_product_code_unique_validation(self, auth_headers, test_category):
        """Test that duplicate product codes are rejected"""
        unique_code = f"TEST_DUP_{uuid.uuid4().hex[:8]}"
        
        # Create first product
        response1 = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "First Product",
                "category": test_category["name"],
                "base_price": 50.0
            }
        )
        assert response1.status_code == 200
        product_id = response1.json()["product"]["id"]
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Duplicate Product",
                "category": test_category["name"],
                "base_price": 60.0
            }
        )
        assert response2.status_code == 400, "Duplicate product code should fail"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
    
    def test_get_product_by_id(self, auth_headers, test_category):
        """Test getting a single product by ID"""
        unique_code = f"TEST_GET_{uuid.uuid4().hex[:8]}"
        
        # Create product
        create_response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Get Test Product",
                "category": test_category["name"],
                "base_price": 75.0
            }
        )
        assert create_response.status_code == 200
        product_id = create_response.json()["product"]["id"]
        
        # Get product by ID
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == product_id
        assert data["product_code"] == unique_code
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
    
    def test_update_product_success(self, auth_headers, test_category):
        """Test updating a product"""
        unique_code = f"TEST_UPD_{uuid.uuid4().hex[:8]}"
        
        # Create product
        create_response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Original Name",
                "category": test_category["name"],
                "base_price": 100.0
            }
        )
        assert create_response.status_code == 200
        product_id = create_response.json()["product"]["id"]
        
        # Update product
        update_response = requests.put(f"{BASE_URL}/api/products/{product_id}", 
            headers=auth_headers,
            json={
                "name": "Updated Name",
                "base_price": 150.0,
                "description": "Updated description"
            }
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["name"] == "Updated Name"
        assert data["base_price"] == 150.0
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        assert get_response.json()["name"] == "Updated Name"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
    
    def test_delete_product_success(self, auth_headers, test_category):
        """Test deleting a product"""
        unique_code = f"TEST_DEL_{uuid.uuid4().hex[:8]}"
        
        # Create product
        create_response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Delete Test Product",
                "category": test_category["name"],
                "base_price": 25.0
            }
        )
        assert create_response.status_code == 200
        product_id = create_response.json()["product"]["id"]
        
        # Delete product
        delete_response = requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        assert get_response.status_code == 404, "Deleted product should return 404"


class TestProductFiltering(TestAuth):
    """Product listing, pagination and filtering tests"""
    
    def test_products_pagination(self, auth_headers):
        """Test products pagination parameters"""
        # Test with limit
        response = requests.get(f"{BASE_URL}/api/products?limit=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) <= 5
        
        # Test with skip
        response2 = requests.get(f"{BASE_URL}/api/products?skip=0&limit=10", headers=auth_headers)
        assert response2.status_code == 200
    
    def test_products_search_filter(self, auth_headers):
        """Test products search filter"""
        # Create a product with unique name
        unique_code = f"TEST_SRCH_{uuid.uuid4().hex[:8]}"
        unique_name = f"SearchableProduct_{uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": unique_name,
                "category": "Test",
                "base_price": 10.0
            }
        )
        assert create_response.status_code == 200
        product_id = create_response.json()["product"]["id"]
        
        # Search for the product
        search_response = requests.get(f"{BASE_URL}/api/products?search={unique_name[:10]}", headers=auth_headers)
        assert search_response.status_code == 200
        products = search_response.json()["products"]
        assert any(p["id"] == product_id for p in products), "Search should find the product"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
    
    def test_products_category_filter(self, auth_headers):
        """Test products category filter"""
        # Create a category and product
        unique_cat = f"TEST_FilterCat_{uuid.uuid4().hex[:8]}"
        unique_code = f"TEST_FILT_{uuid.uuid4().hex[:8]}"
        
        # Create category
        cat_response = requests.post(f"{BASE_URL}/api/categories", 
            headers=auth_headers,
            json={"name": unique_cat}
        )
        assert cat_response.status_code == 200
        cat_id = cat_response.json()["category"]["id"]
        
        # Create product in category
        prod_response = requests.post(f"{BASE_URL}/api/products", 
            headers=auth_headers,
            json={
                "product_code": unique_code,
                "name": "Filter Test Product",
                "category": unique_cat,
                "base_price": 20.0
            }
        )
        assert prod_response.status_code == 200
        product_id = prod_response.json()["product"]["id"]
        
        # Filter by category
        filter_response = requests.get(f"{BASE_URL}/api/products?category={unique_cat}", headers=auth_headers)
        assert filter_response.status_code == 200
        products = filter_response.json()["products"]
        assert all(p["category"] == unique_cat for p in products), "All products should be in filtered category"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)


class TestRegressionFAZ1to4(TestAuth):
    """Regression tests for FAZ 1-4 features"""
    
    def test_customers_endpoint_works(self, auth_headers):
        """Test that customers endpoint still works (FAZ 1)"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_regions_endpoint_works(self, auth_headers):
        """Test that regions endpoint still works (FAZ 1)"""
        response = requests.get(f"{BASE_URL}/api/regions", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_visits_endpoint_works(self, auth_headers):
        """Test that visits endpoint still works (FAZ 1)"""
        response = requests.get(f"{BASE_URL}/api/visits", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_follow_ups_endpoint_works(self, auth_headers):
        """Test that follow-ups endpoint still works (FAZ 1)"""
        response = requests.get(f"{BASE_URL}/api/follow-ups", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_analytics_endpoint_works(self, auth_headers):
        """Test that analytics endpoint still works (FAZ 2)"""
        response = requests.get(f"{BASE_URL}/api/analytics/performance?period=weekly", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "visit_performance" in data
        assert "payment_performance" in data
    
    def test_vehicles_endpoint_works(self, auth_headers):
        """Test that vehicles endpoint still works (FAZ 4)"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_auth_me_endpoint_works(self, auth_headers):
        """Test that auth/me endpoint still works (FAZ 3)"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
