import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from main import get_continue_watching
    print("Running get_continue_watching()...")
    results = get_continue_watching()
    print("Success! Results Count:", len(results))
    for res in results:
        print(f"- {res['title']} ({res['type']})")
except Exception as e:
    print("Error caught during get_continue_watching():")
    import traceback
    traceback.print_exc()
