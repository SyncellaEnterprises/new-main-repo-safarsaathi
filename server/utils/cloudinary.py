import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import os 
from typing import List, Union

cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image(local_file_path: str) -> Union[dict, None]:
    """
    Uploads an image to Cloudinary and removes the local file after upload.
    
    Args:
        local_file_path (str): Path to the local image file.

    Returns:
        Union[dict, None]: Response from Cloudinary if successful, None if failed.
    """
    try:
        if not local_file_path:
            return None
            
        # Upload the file to Cloudinary
        response = cloudinary.uploader.upload(
            local_file_path,
            resource_type="image"
        )
        
        print("File is uploaded on Cloudinary:", response.get("url"))
        
        # Remove the local file after successful upload
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
            
        return response
        
    except Exception as error:
        print(f"Error uploading image: {error}")
        # Remove the local file if upload fails
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
        return None

def upload_video(local_file_path: str) -> Union[dict, None]:
    """
    Uploads a video to Cloudinary and removes the local file after upload.
    
    Args:
        local_file_path (str): Path to the local video file.

    Returns:
        Union[dict, None]: Response from Cloudinary if successful, None if failed.
    """
    try:
        if not local_file_path:
            return None
            
        # Upload the file to Cloudinary
        response = cloudinary.uploader.upload(
            local_file_path,
            resource_type="video",
            chunk_size=6000000,  # 6MB chunks for better handling of large files
            eager=[
                {"format": "mp4", "quality": "auto"},
                {"format": "webm", "quality": "auto"}
            ],
            eager_async=True
        )
        
        print("File is uploaded on Cloudinary:", response.get("url"))
        
        # Remove the local file after successful upload
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
            
        return response
        
    except Exception as error:
        print(f"Error uploading video: {error}")
        # Remove the local file if upload fails
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
        return None