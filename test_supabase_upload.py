"""
Test script for Supabase Storage integration
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv('.env.local')

from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Test: Generate a simple plot and upload to Supabase
from api.services.storage_service import upload_plot_to_supabase

def test_upload():
    # Create a simple test plot
    plt.figure(figsize=(6, 4))
    plt.plot([1, 2, 3, 4], [1, 4, 9, 16], 'b-o')
    plt.title('Test Plot for Supabase')
    plt.xlabel('X')
    plt.ylabel('Y')
    
    # Save to buffer
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100)
    plt.close()
    buf.seek(0)
    
    # Upload to Supabase
    print("🚀 Uploading test image to Supabase...")
    try:
        url = upload_plot_to_supabase(buf, "test_upload.png")
        print(f"✅ Success! Public URL: {url}")
        return url
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    test_upload()
