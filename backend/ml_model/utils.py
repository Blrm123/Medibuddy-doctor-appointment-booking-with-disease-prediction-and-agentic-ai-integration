import numpy as np
from PIL import Image

def preprocess_image(file_or_image):
    """
    Preprocess image for Keras models (resize to 224x224, normalize 0-1, add batch dimension).
    Accepts file-like object or PIL Image object.
    """
    if isinstance(file_or_image, Image.Image):
        img = file_or_image.convert("RGB")
    else:
        img = Image.open(file_or_image).convert("RGB")
    
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array
