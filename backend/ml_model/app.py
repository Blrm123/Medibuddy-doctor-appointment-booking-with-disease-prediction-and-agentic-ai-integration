import os

# Fix Mac mutex crash
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import streamlit as st
import tensorflow as tf
import numpy as np
from PIL import Image
import joblib

st.set_page_config(page_title="Medical AI System", layout="centered")

st.title("🩺 AI Medical Diagnosis System")

st.write("Select a model and upload a medical image for prediction.")

# -----------------------------
# Model Loaders (cached)
# -----------------------------

@st.cache_resource
def load_xray():
    return tf.keras.models.load_model("xray_model.h5")

@st.cache_resource
def load_mri():
    return tf.keras.models.load_model("mri_model.h5")

@st.cache_resource
def load_ultrasound():
    return tf.keras.models.load_model("ultrasound_model.h5")

@st.cache_resource
def load_symptom():
    return joblib.load("symptom_model.pkl")


# -----------------------------
# Image Preprocessing
# -----------------------------

def preprocess_image(image):
    image = image.resize((224,224))
    img = np.array(image)/255.0
    img = np.expand_dims(img, axis=0)
    return img


# -----------------------------
# Model Selection
# -----------------------------

model_choice = st.selectbox(
    "Select AI Model",
    ["X-ray Model", "MRI Model", "Ultrasound Model", "Symptom Model"]
)


# -----------------------------
# X-RAY MODEL
# -----------------------------


if model_choice == "X-ray Model":

    uploaded_file = st.file_uploader("Upload X-ray Image", type=["png","jpg","jpeg"])

    if uploaded_file:

        image = Image.open(uploaded_file).convert("RGB")
        st.image(image, caption="Uploaded X-ray", use_column_width=True)

        model = load_xray()

        img = preprocess_image(image)

        prediction = model.predict(img)

        classes = ["covid", "normal", "pneumonia", "tuberculosis"]

        pred_class = np.argmax(prediction)
        confidence = prediction[0][pred_class]

        st.success(f"Prediction: {classes[pred_class]}")
        st.info(f"Confidence: {confidence*100:.2f}%")

# -----------------------------
# MRI MODEL
# -----------------------------

elif model_choice == "MRI Model":

    uploaded_file = st.file_uploader("Upload MRI Image", type=["png","jpg","jpeg"])

    if uploaded_file:

        image = Image.open(uploaded_file).convert("RGB")
        st.image(image, caption="Uploaded MRI", use_column_width=True)

        model = load_mri()
        img = preprocess_image(image)

        prediction = model.predict(img)

        classes = ["glioma", "meningioma", "notumor", "pituitary"]

        pred_class = np.argmax(prediction)
        confidence = prediction[0][pred_class]

        st.success(f"Prediction: {classes[pred_class]}")
        st.info(f"Confidence: {confidence*100:.2f}%")


# -----------------------------
# ULTRASOUND MODEL
# -----------------------------

elif model_choice == "Ultrasound Model":

    uploaded_file = st.file_uploader("Upload Ultrasound Image", type=["png","jpg","jpeg"])

    if uploaded_file:

        image = Image.open(uploaded_file).convert("RGB")
        st.image(image, caption="Uploaded Ultrasound", use_column_width=True)

        model = load_ultrasound()
        img = preprocess_image(image)
        prediction = model.predict(img)

        classes = ["benign", "malignant", "normal"]

        pred_class = np.argmax(prediction)
        confidence = prediction[0][pred_class]

        st.success(f"Prediction: {classes[pred_class]}")
        st.info(f"Confidence: {confidence*100:.2f}%")


# -----------------------------
# SYMPTOM MODEL
# -----------------------------

elif model_choice == "Symptom Model":

    import pandas as pd
    import numpy as np
    import joblib
    import streamlit as st

    # Load dataset to get symptom names
    df = pd.read_csv("Testing.csv")

    symptoms = list(df.columns[:-1])  # remove prognosis


    @st.cache_resource
    def load_symptom_model():
        return joblib.load("symptom_model.pkl")


    st.subheader("🧾 Symptom Analysis")

    user_text = st.text_input(
        "Enter your symptoms (example: high fever, cough, headache)"
    )


    def text_to_vector(text):

        text = text.lower()

        vector = [0] * len(symptoms)

        for i, symptom in enumerate(symptoms):

            s = symptom.replace("_", " ")

            if s in text:
                vector[i] = 1

        return np.array([vector])


    if st.button("Analyze Symptoms"):

        if user_text:

            model = load_symptom_model()

            X = text_to_vector(user_text)

            prediction = model.predict(X)

            st.success(f"Predicted Disease: {prediction[0]}")