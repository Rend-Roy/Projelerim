#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Satış temsilcisi için günlük müşteri ziyareti takip uygulaması (Türkçe).
  FAZ 2 - Saha Ziyaret Kalitesi özellikleri eklendi:
  1. Ziyaret Süresi Takibi (Başlat/Bitir)
  2. Ziyaret Kalitesi (1-5 yıldız)
  3. Müşteri Uyarıları (Kırmızı Bayrak)

backend:
  - task: "Follow-Up CRUD API endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Follow-up oluşturma, listeleme ve tamamlama API'leri test edildi. Curl ile doğrulandı."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. All Follow-Up CRUD operations working correctly: POST /api/follow-ups (creates with required customer_id, due_date and optional fields), GET /api/follow-ups?date= (returns array with customer info), POST /api/follow-ups/{id}/complete (changes status to 'done', sets completed_at, returns Turkish message 'Takip tamamlandı'). All response structures validated."

  - task: "FAZ 2 - Visit Start/End API endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/visits/{id}/start ve /end endpoint'leri eklendi. Süre otomatik hesaplanıyor."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. Visit duration tracking working perfectly: POST /api/visits/{id}/start sets started_at timestamp and returns Turkish message 'Ziyaret başlatıldı'. POST /api/visits/{id}/end calculates duration_minutes correctly and returns 'Ziyaret tamamlandı' with ended_at and duration. Error handling validated: fails correctly if already started/ended or not started yet. All response structures validated."

  - task: "FAZ 2 - Customer Alerts API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Customer modeline alerts array eklendi. GET /api/customer-alerts endpoint'i eklendi."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. Customer alerts system working perfectly: GET /api/customer-alerts returns all 6 Turkish alert options correctly ('Geç öder', 'Fiyat hassas', 'Belirli saatlerde', 'Özel anlaşma var', 'Tahsilat problemi var', 'Sürekli erteleme yapıyor'). PUT /api/customers/{id} with alerts array saves and retrieves alerts correctly. Clearing alerts functionality validated."

  - task: "FAZ 2 - Analytics visit_quality metrics"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Analytics endpoint'ine visit_quality objesi eklendi: duration (avg, short, long) ve rating (avg, distribution)"
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. Analytics visit_quality metrics working perfectly: GET /api/analytics/performance returns complete visit_quality object with duration metrics (average_minutes, total_measured, short_visits <5min, long_visits >60min) and rating metrics (average_rating, total_rated, distribution 1-5, quality_payment_relation). All data structures validated and calculations working correctly."

frontend:
  - task: "FAZ 2 - Visit Duration Timer UI"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/CustomerDetailPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Ziyaret Süresi bölümü, Başlat/Bitir butonları ve sayaç ekranda görünüyor ve çalışıyor."

  - task: "FAZ 2 - Quality Rating UI"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/CustomerDetailPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "1-5 yıldız puanlama UI'ı CustomerDetailPage'e eklendi."

  - task: "FAZ 2 - Customer Alerts in CustomerCard"
    implemented: true
    working: true
    file: "/app/frontend/src/components/CustomerCard.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Müşteri kartlarında uyarı ikonu ve metni görünüyor. Kırmızı durum çubuğu var."

  - task: "FAZ 2 - Customer Alerts in Form"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/CustomerFormPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Müşteri formuna uyarı seçim bölümü eklendi. 6 uyarı seçeneği mevcut."

  - task: "FAZ 2 - Performance metrics UI"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/PerformancePage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Ort. Ziyaret Süresi, Ort. Kalite, Çok Kısa/Uzun ziyaret metrikleri eklendi."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 3
  run_ui: true

test_plan:
  current_focus:
    - "FAZ 2 - Ziyaret Süresi Takibi"
    - "FAZ 2 - Ziyaret Kalitesi Puanlama"
    - "FAZ 2 - Müşteri Uyarıları"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      FAZ 2 geliştirmeleri tamamlandı. Test edilmesi gereken özellikler:
      
      1. BACKEND TESTLERİ:
         - POST /api/visits/{id}/start - Ziyareti başlat
         - POST /api/visits/{id}/end - Ziyareti bitir (süre hesaplanmalı)
         - PUT /api/visits/{id} - quality_rating alanı eklendi
         - PUT /api/customers/{id} - alerts array alanı eklendi
         - GET /api/customer-alerts - Uyarı seçeneklerini döndür
         - GET /api/analytics/performance - visit_quality objesi eklendi
      
      2. FRONTEND TESTLERİ:
         - CustomerDetailPage: "Ziyareti Başlat" -> Sayaç -> "Ziyareti Bitir" akışı
         - CustomerDetailPage: 1-5 yıldız kalite puanlama
         - CustomerFormPage: Müşteri uyarıları seçimi
         - TodayPage/CustomerCard: Uyarılı müşterilerde kırmızı ikon ve metin
         - PerformancePage: Yeni metrikler (süre, kalite, uyarılar)