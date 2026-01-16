"""
Test FAZ 5 - İnteraktif Kategori Yönetimi
- Kategoriler sayfasında product_count görünmeli
- Boş kategoriler soluk görünmeli
- Kategoriye tıklayınca /products?category=X URL'ine yönlendirmeli
- Ürünler sayfasında URL'den kategori parametresi okunmalı
- Aktif filtre badge'i görünmeli
- Filtre temizlenebilmeli
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCategoryNavigation:
    """Kategori navigasyonu ve filtreleme testleri"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Test setup - login and get token"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_categories_endpoint_returns_product_count(self):
        """Kategoriler endpoint'i product_count döndürmeli"""
        response = requests.get(
            f"{BASE_URL}/api/categories?include_inactive=true",
            headers=self.headers
        )
        assert response.status_code == 200
        categories = response.json()
        
        # Her kategoride product_count alanı olmalı
        for cat in categories:
            assert "product_count" in cat, f"Category {cat['name']} missing product_count"
            assert isinstance(cat["product_count"], int), f"product_count should be int"
        
        print(f"✓ {len(categories)} kategori bulundu, hepsinde product_count var")
        for cat in categories:
            print(f"  - {cat['name']}: {cat['product_count']} ürün")
    
    def test_products_filter_by_category(self):
        """Ürünler endpoint'i kategori filtresi ile çalışmalı"""
        # Önce kategorileri al
        cat_response = requests.get(
            f"{BASE_URL}/api/categories",
            headers=self.headers
        )
        assert cat_response.status_code == 200
        categories = cat_response.json()
        
        if not categories:
            pytest.skip("No categories found")
        
        # Ürünü olan bir kategori bul
        category_with_products = None
        for cat in categories:
            if cat.get("product_count", 0) > 0:
                category_with_products = cat
                break
        
        if not category_with_products:
            pytest.skip("No category with products found")
        
        # Kategori filtresi ile ürünleri al
        response = requests.get(
            f"{BASE_URL}/api/products?category={category_with_products['name']}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Dönen ürünlerin hepsi bu kategoride olmalı
        for product in data.get("products", []):
            assert product["category"] == category_with_products["name"], \
                f"Product {product['name']} has wrong category"
        
        print(f"✓ Kategori filtresi çalışıyor: {category_with_products['name']} -> {len(data.get('products', []))} ürün")
    
    def test_products_without_filter_returns_all(self):
        """Filtre olmadan tüm ürünler dönmeli"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        print(f"✓ Tüm ürünler: {data['total']} adet")
    
    def test_empty_category_filter_returns_empty(self):
        """Boş kategoride ürün olmamalı"""
        # Önce kategorileri al
        cat_response = requests.get(
            f"{BASE_URL}/api/categories?include_inactive=true",
            headers=self.headers
        )
        assert cat_response.status_code == 200
        categories = cat_response.json()
        
        # Boş kategori bul
        empty_category = None
        for cat in categories:
            if cat.get("product_count", 0) == 0:
                empty_category = cat
                break
        
        if not empty_category:
            pytest.skip("No empty category found")
        
        # Boş kategori ile filtrele
        response = requests.get(
            f"{BASE_URL}/api/products?category={empty_category['name']}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data.get("products", [])) == 0, "Empty category should return no products"
        print(f"✓ Boş kategori filtresi çalışıyor: {empty_category['name']} -> 0 ürün")
    
    def test_create_category_and_verify_product_count(self):
        """Yeni kategori oluştur ve product_count=0 olduğunu doğrula"""
        # Yeni kategori oluştur
        new_cat = {
            "name": "TEST_EmptyCategory",
            "description": "Test için boş kategori"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/categories",
            headers=self.headers,
            json=new_cat
        )
        assert create_response.status_code == 200
        created = create_response.json()
        
        # Kategorileri tekrar al ve product_count kontrol et
        cat_response = requests.get(
            f"{BASE_URL}/api/categories?include_inactive=true",
            headers=self.headers
        )
        categories = cat_response.json()
        
        test_cat = next((c for c in categories if c["name"] == "TEST_EmptyCategory"), None)
        assert test_cat is not None, "Created category not found"
        assert test_cat["product_count"] == 0, "New category should have 0 products"
        
        print(f"✓ Yeni kategori oluşturuldu: {test_cat['name']} -> product_count=0")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/categories/{created['id']}", headers=self.headers)
    
    def test_category_product_count_updates_after_product_creation(self):
        """Ürün eklenince kategori product_count güncellenmeli"""
        # Önce kategorileri al
        cat_response = requests.get(
            f"{BASE_URL}/api/categories",
            headers=self.headers
        )
        categories = cat_response.json()
        
        if not categories:
            pytest.skip("No categories found")
        
        target_category = categories[0]
        initial_count = target_category.get("product_count", 0)
        
        # Yeni ürün ekle
        new_product = {
            "product_code": "TEST_PROD_001",
            "name": "Test Ürün",
            "category": target_category["name"],
            "base_price": 100,
            "unit": "Adet"
        }
        prod_response = requests.post(
            f"{BASE_URL}/api/products",
            headers=self.headers,
            json=new_product
        )
        assert prod_response.status_code == 200
        created_product = prod_response.json()
        
        # Kategorileri tekrar al
        cat_response2 = requests.get(
            f"{BASE_URL}/api/categories",
            headers=self.headers
        )
        categories2 = cat_response2.json()
        
        updated_category = next((c for c in categories2 if c["name"] == target_category["name"]), None)
        assert updated_category is not None
        assert updated_category["product_count"] == initial_count + 1, \
            f"Product count should increase from {initial_count} to {initial_count + 1}"
        
        print(f"✓ Ürün eklendi, product_count güncellendi: {initial_count} -> {updated_category['product_count']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{created_product['id']}", headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
