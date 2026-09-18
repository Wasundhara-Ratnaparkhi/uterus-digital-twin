import os
import cv2
import numpy as np


# ==========================================================
# MODEL PATH
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "tube_patency_resnet50.onnx"
)


# ==========================================================
# MODEL INSTANCE
# ==========================================================

_net = None


# ==========================================================
# LOAD ONNX MODEL
# ==========================================================

def load_tube_model():
    """
    Loads the trained ResNet50 ONNX model using
    OpenCV DNN.

    The model performs binary HSG classification:

        0 → Blocked
        1 → Not Blocked
    """

    global _net

    if _net is None:

        if not os.path.exists(MODEL_PATH):

            raise FileNotFoundError(
                "HSG model not found at: "
                + MODEL_PATH
            )

        _net = cv2.dnn.readNetFromONNX(
            MODEL_PATH
        )

    return _net


# ==========================================================
# IMAGE PREPROCESSING
# ==========================================================

def preprocess_hsg_image(
    image_bytes
):
    """
    Converts uploaded HSG image bytes into the
    input blob expected by the ResNet50 ONNX model.
    """

    # Convert bytes to NumPy array
    file_bytes = np.asarray(
        bytearray(image_bytes),
        dtype=np.uint8
    )

    # Decode image
    image = cv2.imdecode(
        file_bytes,
        cv2.IMREAD_COLOR
    )

    if image is None:

        raise ValueError(
            "Could not read the uploaded HSG image."
        )

    # Resize to model input size
    image = cv2.resize(
        image,
        (160, 160)
    )

    # ------------------------------------------------------
    # ResNet50 preprocessing
    # ------------------------------------------------------

    blob = cv2.dnn.blobFromImage(

        image,

        scalefactor=1.0,

        size=(160, 160),

        mean=(
            103.939,
            116.779,
            123.68
        ),

        swapRB=False,

        crop=False
    )

    return blob


# ==========================================================
# PREDICT TUBE PATENCY
# ==========================================================

def predict_tube_patency(
    uploaded_file
):
    """
    Performs HSG tube-patency prediction.

    Input:
        Flask uploaded file object

    Output:
        status
        confidence
    """

    # ------------------------------------------------------
    # Load model
    # ------------------------------------------------------

    net = load_tube_model()


    # ------------------------------------------------------
    # Read uploaded file
    # ------------------------------------------------------

    image_bytes = uploaded_file.read()

    if not image_bytes:

        raise ValueError(
            "The uploaded HSG image is empty."
        )


    # ------------------------------------------------------
    # Preprocess image
    # ------------------------------------------------------

    blob = preprocess_hsg_image(
        image_bytes
    )


    # ------------------------------------------------------
    # Run inference
    # ------------------------------------------------------

    net.setInput(blob)

    output = net.forward()


    # ------------------------------------------------------
    # Convert model output to scalar
    # ------------------------------------------------------

    prediction = float(
        np.asarray(output)
        .reshape(-1)[0]
    )


    # ------------------------------------------------------
    # Binary classification
    #
    # Model mapping:
    #
    # 0 → Blocked
    # 1 → Not Blocked
    # ------------------------------------------------------

    if prediction >= 0.5:

        status = "Not Blocked"

        confidence = (
            prediction * 100
        )

    else:

        status = "Blocked"

        confidence = (
            (1 - prediction) * 100
        )


    # ------------------------------------------------------
    # Limit confidence to valid range
    # ------------------------------------------------------

    confidence = max(
        0.0,
        min(
            100.0,
            confidence
        )
    )


    return (
        status,
        confidence
    )


# ==========================================================
# OPTIONAL: IMAGE VALIDATION
# ==========================================================

def validate_hsg_image(
    uploaded_file
):
    """
    Basic validation before inference.
    """

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png"
    }

    filename = getattr(
        uploaded_file,
        "filename",
        ""
    )

    extension = os.path.splitext(
        filename
    )[1].lower()

    if extension not in allowed_extensions:

        raise ValueError(
            "Please upload a JPG, JPEG, or PNG HSG image."
        )

    return True


# ==========================================================
# LOCAL MODEL TEST
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("FertiScan HSG Tube Patency Engine")
    print("=" * 60)

    print()

    if os.path.exists(MODEL_PATH):

        print(
            "✓ HSG ONNX model found:"
        )

        print(
            MODEL_PATH
        )

        try:

            model = load_tube_model()

            print()
            print(
                "✓ ONNX model loaded successfully."
            )

            print()
            print(
                "Input processing:"
            )

            print(
                "  Image size: 160 × 160"
            )

            print(
                "  Backend: OpenCV DNN"
            )

            print(
                "  Model: ResNet50 ONNX"
            )

            print()
            print(
                "Output classes:"
            )

            print(
                "  0 → Blocked"
            )

            print(
                "  1 → Not Blocked"
            )

            print()
            print(
                "✓ HSG inference engine ready."
            )

        except Exception as e:

            print()
            print(
                "✗ Model loading failed:"
            )

            print(
                str(e)
            )

    else:

        print(
            "✗ HSG ONNX model not found."
        )

        print(
            "Expected location:"
        )

        print(
            MODEL_PATH
        )