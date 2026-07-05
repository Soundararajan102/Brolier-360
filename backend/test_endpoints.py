import sys
import traceback
from fastapi.testclient import TestClient

try:
    from app.main import app
except Exception as e:
    print(f"FAILED to import app: {e}")
    traceback.print_exc()
    sys.exit(1)

client = TestClient(app)

endpoints_to_test = [
    "/api/dashboard/stats",
    "/api/campaigns/reports",
    "/api/media",
    "/api/inbox/threads"
]

all_passed = True

print("Starting endpoint tests...")
for endpoint in endpoints_to_test:
    print(f"Testing GET {endpoint}...")
    try:
        response = client.get(endpoint)
        if response.status_code == 200:
            print(f"  OK: {response.status_code}")
        else:
            print(f"  FAILED: Status code {response.status_code}")
            print(f"  Response: {response.text}")
            all_passed = False
    except Exception as e:
        print(f"  ERROR: Exception while hitting endpoint: {e}")
        traceback.print_exc()
        all_passed = False

if all_passed:
    print("All tests passed.")
    sys.exit(0)
else:
    print("Some tests failed.")
    sys.exit(1)
