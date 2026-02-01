"""
Supabase Storage Service
Handles uploading plot images to Supabase Storage and returns public URLs
"""
import os
from io import BytesIO
from supabase import create_client, Client

BUCKET_NAME = "plot-images"


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    # Read environment variables at runtime (after dotenv has loaded)
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise Exception("Supabase 환경변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_KEY를 확인하세요.")
    return create_client(supabase_url, supabase_key)


def upload_plot_to_supabase(image_buffer: BytesIO, filename: str) -> str:
    """
    Upload a plot image to Supabase Storage and return the public URL.
    
    Args:
        image_buffer: BytesIO buffer containing the PNG image
        filename: The filename to save (e.g., 'graph_uuid.png')
    
    Returns:
        Public URL of the uploaded image
    """
    supabase = get_supabase_client()
    
    # Ensure buffer is at the start
    image_buffer.seek(0)
    image_bytes = image_buffer.read()
    
    # Upload to Supabase Storage
    response = supabase.storage.from_(BUCKET_NAME).upload(
        path=filename,
        file=image_bytes,
        file_options={"content-type": "image/png", "upsert": "true"}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
    
    return public_url


def delete_plot_from_supabase(filename: str) -> bool:
    """
    Delete a plot image from Supabase Storage.
    
    Args:
        filename: The filename to delete
    
    Returns:
        True if deletion was successful
    """
    try:
        supabase = get_supabase_client()
        supabase.storage.from_(BUCKET_NAME).remove([filename])
        return True
    except Exception as e:
        print(f"Error deleting file from Supabase: {e}")
        return False
