// ============================================
// FERTISCAN - HSG TUBE PATENCY ANALYSIS
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Initializing FertiScan HSG module...");


    // ============================================
    // GET ELEMENTS
    // ============================================

    const hsgImage =
        document.getElementById("hsgImage");

    const uploadArea =
        document.getElementById("uploadArea");

    const imagePreviewContainer =
        document.getElementById(
            "imagePreviewContainer"
        );

    const hsgPreview =
        document.getElementById("hsgPreview");

    const removeHsgBtn =
        document.getElementById("removeHsgBtn");

    const analyzeHsgBtn =
        document.getElementById("analyzeHsgBtn");

    const hsgLoading =
        document.getElementById("hsgLoading");

    const hsgEmptyState =
        document.getElementById("hsgEmptyState");

    const hsgResult =
        document.getElementById("hsgResult");

    const hsgStatus =
        document.getElementById("hsgStatus");

    const hsgConfidence =
        document.getElementById("hsgConfidence");

    const hsgInterpretation =
        document.getElementById(
            "hsgInterpretation"
        );


    // ============================================
    // CHECK REQUIRED ELEMENTS
    // ============================================

    console.log("HSG elements:", {
        hsgImage: !!hsgImage,
        uploadArea: !!uploadArea,
        imagePreviewContainer:
            !!imagePreviewContainer,
        hsgPreview: !!hsgPreview,
        removeHsgBtn: !!removeHsgBtn,
        analyzeHsgBtn: !!analyzeHsgBtn,
        hsgLoading: !!hsgLoading,
        hsgEmptyState: !!hsgEmptyState,
        hsgResult: !!hsgResult,
        hsgStatus: !!hsgStatus,
        hsgConfidence: !!hsgConfidence,
        hsgInterpretation:
            !!hsgInterpretation
    });


    // ============================================
    // SELECTED FILE
    // ============================================

    let selectedFile = null;


    // ============================================
    // FILE INPUT CHANGE
    // ============================================

    if (hsgImage) {

        hsgImage.addEventListener(
            "change",
            event => {

                console.log(
                    "HSG file input changed."
                );

                const files =
                    event.target.files;

                if (
                    !files ||
                    files.length === 0
                ) {
                    return;
                }

                handleSelectedFile(
                    files[0]
                );

            }
        );

    }


    // ============================================
    // HANDLE SELECTED FILE
    // ============================================

    function handleSelectedFile(file) {

        if (!file) {
            return;
        }


        console.log(
            "Selected HSG file:",
            file.name,
            file.type,
            file.size
        );


        // ----------------------------------------
        // Validate image
        // ----------------------------------------

        if (
            !file.type ||
            !file.type.startsWith("image/")
        ) {

            alert(
                "Please select a valid HSG image.\n\n" +
                "Supported formats: JPG, JPEG, PNG."
            );

            clearFileInput();

            return;
        }


        // ----------------------------------------
        // Validate size
        // ----------------------------------------

        const maxSize =
            10 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "Image size must be less than 10 MB."
            );

            clearFileInput();

            return;
        }


        // ----------------------------------------
        // Store file
        // ----------------------------------------

        selectedFile = file;


        // ----------------------------------------
        // Show preview
        // ----------------------------------------

        showImagePreview(file);


        // ----------------------------------------
        // Hide old result
        // ----------------------------------------

        hideHSGResult();


        // ----------------------------------------
        // Enable analyze button
        // ----------------------------------------

        setAnalyzeButtonState(true);


        console.log(
            "HSG file ready for analysis."
        );

    }


    // ============================================
    // SHOW IMAGE PREVIEW
    // ============================================

    function showImagePreview(file) {

        if (!hsgPreview) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload = event => {

            hsgPreview.src =
                event.target.result;


            if (imagePreviewContainer) {

                imagePreviewContainer.classList.remove(
                    "hidden"
                );

            }


            if (hsgEmptyState) {

                hsgEmptyState.classList.add(
                    "hidden"
                );

            }


            console.log(
                "HSG image preview displayed."
            );

        };


        reader.onerror = () => {

            console.error(
                "Unable to read HSG image."
            );

            alert(
                "Unable to read the selected image."
            );

        };


        reader.readAsDataURL(file);

    }


    // ============================================
    // REMOVE IMAGE
    // ============================================

    if (removeHsgBtn) {

        removeHsgBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                removeHSGImage();

            }
        );

    }


    function removeHSGImage() {

        console.log(
            "Removing HSG image."
        );


        selectedFile = null;


        clearFileInput();


        if (hsgPreview) {

            hsgPreview.removeAttribute(
                "src"
            );

            hsgPreview.src = "";

        }


        if (imagePreviewContainer) {

            imagePreviewContainer.classList.add(
                "hidden"
            );

        }


        if (hsgEmptyState) {

            hsgEmptyState.classList.remove(
                "hidden"
            );

        }


        hideHSGResult();


        setAnalyzeButtonState(false);

    }


    // ============================================
    // CLEAR FILE INPUT
    // ============================================

    function clearFileInput() {

        if (hsgImage) {
            hsgImage.value = "";
        }

    }


    // ============================================
    // ANALYZE BUTTON
    // ============================================

    if (analyzeHsgBtn) {

        analyzeHsgBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "Analyze Tube Patency button clicked."
                );


                analyzeHSG();

            }
        );

    } else {

        console.error(
            "Analyze HSG button not found."
        );

    }


    // ============================================
    // ANALYZE HSG
    // ============================================

    async function analyzeHSG() {

        if (!selectedFile) {

            alert(
                "Please upload an HSG image first."
            );

            console.warn(
                "HSG analysis cancelled: no file."
            );

            return;
        }


        console.log(
            "Starting HSG analysis:",
            selectedFile.name
        );


        setAnalyzeButtonState(false);


        if (hsgLoading) {

            hsgLoading.classList.remove(
                "hidden"
            );

        }


        hideHSGResult();


        try {

            // ====================================
            // CREATE FORM DATA
            // ====================================

            const formData =
                new FormData();


            formData.append(
                "image",
                selectedFile,
                selectedFile.name
            );


            console.log(
                "Sending HSG image to /api/hsg..."
            );


            // ====================================
            // SEND TO FLASK
            // ====================================

            const response =
                await fetch(
                    "/api/hsg",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            console.log(
                "HSG API response status:",
                response.status
            );


            // ====================================
            // READ RESPONSE
            // ====================================

            const responseText =
                await response.text();


            console.log(
                "HSG API raw response:",
                responseText
            );


            let result;


            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch (jsonError) {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            console.log(
                "HSG API result:",
                result
            );


            // ====================================
            // CHECK RESPONSE
            // ====================================

            if (!response.ok) {

                throw new Error(
                    result.error ||
                    result.message ||
                    "HSG analysis failed."
                );

            }


            // ====================================
            // DISPLAY RESULT
            // ====================================

            displayHSGResult(
                result
            );


        } catch (error) {

            console.error(
                "HSG analysis error:",
                error
            );


            alert(
                "Unable to analyze the HSG image.\n\n" +
                error.message
            );


        } finally {

            if (hsgLoading) {

                hsgLoading.classList.add(
                    "hidden"
                );

            }


            setAnalyzeButtonState(
                selectedFile !== null
            );

        }

    }


    // ============================================
    // DISPLAY HSG RESULT
    // ============================================

    function displayHSGResult(result) {

        console.log(
            "Displaying HSG result:",
            result
        );


        // ========================================
        // IMPORTANT:
        // Flask returns:
        //
        // {
        //     "result": {
        //         "status": "Not Blocked",
        //         "confidence": 94.94
        //     },
        //     "success": true
        // }
        //
        // Therefore we first extract result.result
        // ========================================

        const predictionResult =
            result.result || result;


        // ========================================
        // GET STATUS
        // ========================================

        let status =
            predictionResult.status;


        if (
            status === undefined ||
            status === null ||
            String(status).trim() === ""
        ) {

            status =
                predictionResult.prediction ||
                predictionResult.label ||
                predictionResult.tube_status ||
                predictionResult.tube_patency ||
                "Unknown";

        }


        status =
            String(status).trim();


        // ========================================
        // GET CONFIDENCE
        // ========================================

        let confidence =
            Number(
                predictionResult.confidence
            );


        if (
            !Number.isFinite(confidence)
        ) {

            confidence =
                Number(
                    predictionResult.prediction_confidence
                );

        }


        if (
            !Number.isFinite(confidence)
        ) {

            confidence =
                Number(
                    predictionResult.model_confidence
                );

        }


        // ========================================
        // CONVERT 0-1 TO %
        // ========================================

        if (
            Number.isFinite(confidence) &&
            confidence >= 0 &&
            confidence <= 1
        ) {

            confidence =
                confidence * 100;

        }


        console.log(
            "Processed HSG result:",
            {
                status,
                confidence
            }
        );


        // ========================================
        // STATUS DISPLAY
        // ========================================

        if (hsgStatus) {

            hsgStatus.textContent =
                status;


            hsgStatus.classList.remove(
                "blocked",
                "not-blocked",
                "unknown"
            );


            const normalizedStatus =
                status.toLowerCase();


            if (
                normalizedStatus ===
                "blocked"
            ) {

                hsgStatus.classList.add(
                    "blocked"
                );

            } else if (
                normalizedStatus ===
                    "not blocked" ||
                normalizedStatus ===
                    "not_blocked"
            ) {

                hsgStatus.classList.add(
                    "not-blocked"
                );

            } else {

                hsgStatus.classList.add(
                    "unknown"
                );

            }

        }


        // ========================================
        // CONFIDENCE DISPLAY
        // ========================================

        if (hsgConfidence) {

            if (
                Number.isFinite(
                    confidence
                )
            ) {

                hsgConfidence.textContent =
                    `${confidence.toFixed(2)}%`;

            } else {

                hsgConfidence.textContent =
                    "N/A";

            }

        }


        // ========================================
        // INTERPRETATION
        // ========================================

        if (hsgInterpretation) {

            const normalizedStatus =
                status.toLowerCase();


            if (
                normalizedStatus ===
                "blocked"
            ) {

                hsgInterpretation.innerHTML = `

                    <strong>
                        Possible tube blockage detected
                    </strong>

                    <p>
                        The AI model classified
                        the uploaded HSG image as
                        <b>Blocked</b>.
                    </p>

                    <small>
                        This is an AI-based research
                        prediction and is not a
                        clinical diagnosis.
                    </small>

                `;

            } else if (
                normalizedStatus ===
                    "not blocked" ||
                normalizedStatus ===
                    "not_blocked"
            ) {

                hsgInterpretation.innerHTML = `

                    <strong>
                        No blockage classified
                    </strong>

                    <p>
                        The AI model classified
                        the uploaded HSG image as
                        <b>Not Blocked</b>.
                    </p>

                    <small>
                        This is an AI-based research
                        prediction and is not a
                        clinical diagnosis.
                    </small>

                `;

            } else {

                hsgInterpretation.innerHTML = `

                    <strong>
                        Analysis completed
                    </strong>

                    <p>
                        Model result:
                        <b>${escapeHTML(status)}</b>
                    </p>

                    <small>
                        Please consult a qualified
                        medical professional for
                        clinical interpretation.
                    </small>

                `;

            }

        }


        // ========================================
        // SHOW RESULT CARD
        // ========================================

        if (hsgResult) {

            hsgResult.classList.remove(
                "hidden"
            );


            setTimeout(() => {

                hsgResult.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }, 150);

        }


        // ========================================
        // STORE RESULT
        // ========================================

        window.currentHSGResult =
            result;


        console.log(
            "HSG result displayed successfully."
        );

    }


    // ============================================
    // HIDE RESULT
    // ============================================

    function hideHSGResult() {

        if (hsgResult) {

            hsgResult.classList.add(
                "hidden"
            );

        }

    }


    // ============================================
    // BUTTON STATE
    // ============================================

    function setAnalyzeButtonState(
        enabled
    ) {

        if (!analyzeHsgBtn) {
            return;
        }


        analyzeHsgBtn.disabled =
            !enabled;


        if (enabled) {

            analyzeHsgBtn.removeAttribute(
                "aria-disabled"
            );

        } else {

            analyzeHsgBtn.setAttribute(
                "aria-disabled",
                "true"
            );

        }

    }


    // ============================================
    // DRAG AND DROP
    // ============================================

    if (uploadArea) {

        uploadArea.addEventListener(
            "dragover",
            event => {

                event.preventDefault();
                event.stopPropagation();

                uploadArea.classList.add(
                    "dragover"
                );

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            event => {

                event.preventDefault();
                event.stopPropagation();

                uploadArea.classList.remove(
                    "dragover"
                );

            }
        );


        uploadArea.addEventListener(
            "drop",
            event => {

                event.preventDefault();
                event.stopPropagation();


                uploadArea.classList.remove(
                    "dragover"
                );


                const files =
                    event.dataTransfer.files;


                if (
                    !files ||
                    files.length === 0
                ) {

                    return;

                }


                handleSelectedFile(
                    files[0]
                );


                // Synchronize file input
                if (hsgImage) {

                    try {

                        const dataTransfer =
                            new DataTransfer();


                        dataTransfer.items.add(
                            files[0]
                        );


                        hsgImage.files =
                            dataTransfer.files;


                    } catch (error) {

                        console.warn(
                            "Could not synchronize file input.",
                            error
                        );

                    }

                }

            }
        );


        // ========================================
        // CLICK UPLOAD AREA
        // ========================================

        uploadArea.addEventListener(
            "click",
            event => {

                // Do not trigger twice
                if (
                    event.target === hsgImage
                ) {

                    return;

                }


                // Do not open picker when
                // clicking a button
                if (
                    event.target.closest(
                        "button"
                    )
                ) {

                    return;

                }


                if (hsgImage) {

                    hsgImage.click();

                }

            }
        );

    }


    // ============================================
    // INITIAL STATE
    // ============================================

    setAnalyzeButtonState(false);


    // ============================================
    // GLOBAL FUNCTIONS
    // ============================================

    window.analyzeHSG =
        analyzeHSG;

    window.removeHSGImage =
        removeHSGImage;


    window.currentHSGResult =
        null;


    // ============================================
    // HTML ESCAPE HELPER
    // ============================================

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    console.log(
        "FertiScan hsg.js loaded successfully."
    );

});