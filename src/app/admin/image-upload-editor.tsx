"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./admin.module.css";

type AspectPreset = "original" | "1:1" | "4:5" | "9:16" | "16:9";
type Rotation = 0 | 90 | 180 | 270;

const maximumUploadBytes = 4 * 1024 * 1024;
const maximumImagePixels = 40_000_000;
const maximumImageDimension = 8_000;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function aspectValue(preset: AspectPreset, width: number, height: number) {
  if (preset === "1:1") return 1;
  if (preset === "4:5") return 4 / 5;
  if (preset === "9:16") return 9 / 16;
  if (preset === "16:9") return 16 / 9;
  return width / height;
}

function fittedSize(width: number, height: number, maximumSide: number) {
  const scale = Math.min(1, maximumSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("EXPORT_FAILED"))),
      "image/webp",
      quality,
    );
  });
}

function editedName(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "").slice(0, 100) || "image";
  return `${base}-edited.webp`;
}

export function ImageUploadEditor({
  label,
  help,
  minimumWidth,
  minimumHeight,
  defaultAspect = "original",
  currentImage,
  disabled = false,
  onUpload,
}: {
  label: string;
  help: string;
  minimumWidth: number;
  minimumHeight: number;
  defaultAspect?: AspectPreset;
  currentImage?: { src: string; name?: string };
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  const inputId = useId();
  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const sourceImage = useRef<HTMLImageElement | null>(null);
  const objectUrl = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("image");
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState<AspectPreset>(defaultAspect);
  const [outputWidth, setOutputWidth] = useState(minimumWidth);
  const [outputHeight, setOutputHeight] = useState(minimumHeight);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [error, setError] = useState("");

  function getCropSize(
    nextAspect = aspect,
    nextRotation = rotation,
    nextZoom = zoom,
  ) {
    const image = sourceImage.current;
    if (!image) return { width: minimumWidth, height: minimumHeight };
    const rotated = nextRotation === 90 || nextRotation === 270;
    const visualWidth = rotated ? image.naturalHeight : image.naturalWidth;
    const visualHeight = rotated ? image.naturalWidth : image.naturalHeight;
    const targetAspect = aspectValue(nextAspect, visualWidth, visualHeight);
    let width = visualWidth;
    let height = visualHeight;
    if (visualWidth / visualHeight > targetAspect) {
      width = visualHeight * targetAspect;
    } else {
      height = visualWidth / targetAspect;
    }
    return { width: width / nextZoom, height: height / nextZoom };
  }

  function getDefaultOutputSize(width: number, height: number) {
    const minimumScale = Math.max(
      1,
      minimumWidth / width,
      minimumHeight / height,
    );
    return fittedSize(width * minimumScale, height * minimumScale, 4_000);
  }

  function applyCropResolution(nextAspect = aspect, nextRotation = rotation) {
    const crop = getCropSize(nextAspect, nextRotation, zoom);
    const resolution = getDefaultOutputSize(crop.width, crop.height);
    setOutputWidth(resolution.width);
    setOutputHeight(resolution.height);
  }

  function setResolutionFromWidth(width: number) {
    const crop = getCropSize();
    const ratio = crop.width / crop.height;
    const resolution = fittedSize(width, width / ratio, maximumImageDimension);
    setOutputWidth(resolution.width);
    setOutputHeight(resolution.height);
  }

  function setResolutionFromHeight(height: number) {
    const crop = getCropSize();
    const ratio = crop.width / crop.height;
    const resolution = fittedSize(
      height * ratio,
      height,
      maximumImageDimension,
    );
    setOutputWidth(resolution.width);
    setOutputHeight(resolution.height);
  }

  function changeAspect(nextAspect: AspectPreset) {
    setAspect(nextAspect);
    const crop = getCropSize(nextAspect);
    const resolution = fittedSize(
      outputWidth,
      outputWidth / (crop.width / crop.height),
      maximumImageDimension,
    );
    setOutputWidth(resolution.width);
    setOutputHeight(resolution.height);
  }

  function resetEdits() {
    setAspect(defaultAspect);
    setRotation(0);
    setZoom(1);
    setPositionX(0);
    setPositionY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    const crop = getCropSize(defaultAspect, 0, 1);
    const resolution = getDefaultOutputSize(crop.width, crop.height);
    setOutputWidth(resolution.width);
    setOutputHeight(resolution.height);
    setError("");
  }

  function closeEditor(force = false) {
    if (processing && !force) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    sourceImage.current = null;
    setFile(null);
    setSourceName("image");
    setOpen(false);
    setError("");
  }

  function renderEditedCanvas(targetWidth: number, targetHeight: number) {
    const image = sourceImage.current;
    if (!image) throw new Error("IMAGE_NOT_READY");
    const rotated = rotation === 90 || rotation === 270;
    const visualWidth = rotated ? image.naturalHeight : image.naturalWidth;
    const visualHeight = rotated ? image.naturalWidth : image.naturalHeight;
    const targetAspect = aspectValue(aspect, visualWidth, visualHeight);
    let cropWidth = visualWidth;
    let cropHeight = visualHeight;
    if (visualWidth / visualHeight > targetAspect) {
      cropWidth = visualHeight * targetAspect;
    } else {
      cropHeight = visualWidth / targetAspect;
    }
    cropWidth /= zoom;
    cropHeight /= zoom;
    const availableX = Math.max(visualWidth - cropWidth, 0);
    const availableY = Math.max(visualHeight - cropHeight, 0);
    const cropX = ((positionX + 100) / 200) * availableX;
    const cropY = ((positionY + 100) / 200) * availableY;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("CANVAS_UNAVAILABLE");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.scale(targetWidth / cropWidth, targetHeight / cropHeight);
    context.translate(-cropX, -cropY);
    context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (rotation === 90) {
      context.translate(image.naturalHeight, 0);
      context.rotate(Math.PI / 2);
    } else if (rotation === 180) {
      context.translate(image.naturalWidth, image.naturalHeight);
      context.rotate(Math.PI);
    } else if (rotation === 270) {
      context.translate(0, image.naturalWidth);
      context.rotate(-Math.PI / 2);
    }
    context.drawImage(image, 0, 0);
    return canvas;
  }

  useEffect(() => {
    if (!open || !sourceImage.current || !previewCanvas.current) return;
    try {
      const previewSize = fittedSize(outputWidth, outputHeight, 1_000);
      const rendered = renderEditedCanvas(
        previewSize.width,
        previewSize.height,
      );
      const target = previewCanvas.current;
      target.width = rendered.width;
      target.height = rendered.height;
      const context = target.getContext("2d");
      context?.drawImage(rendered, 0, 0);
    } catch {
      previewCanvas.current.width = 0;
      previewCanvas.current.height = 0;
    }
    // Every listed value changes the canvas output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    aspect,
    rotation,
    zoom,
    positionX,
    positionY,
    brightness,
    contrast,
    saturation,
    sourceSize,
    outputWidth,
    outputHeight,
  ]);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) closeEditor();
      if (event.key === "Tab" && dialog.current) {
        const controls = Array.from(
          dialog.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled)",
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // closeEditor is intentionally scoped to the current editor state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, processing]);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  });

  function chooseFile(nextFile?: File) {
    setError("");
    if (!nextFile) return;
    if (!allowedTypes.has(nextFile.type)) {
      setError("Choose a JPG, PNG, WebP, or AVIF image.");
      return;
    }
    if (nextFile.size > maximumUploadBytes || nextFile.size < 64) {
      setError("The source image must be 4 MB or smaller.");
      return;
    }
    const url = URL.createObjectURL(nextFile);
    const image = new window.Image();
    image.onload = () => {
      if (
        image.naturalWidth < minimumWidth ||
        image.naturalHeight < minimumHeight ||
        image.naturalWidth > maximumImageDimension ||
        image.naturalHeight > maximumImageDimension ||
        image.naturalWidth * image.naturalHeight > maximumImagePixels
      ) {
        URL.revokeObjectURL(url);
        setError(
          `Use an image from ${minimumWidth} × ${minimumHeight}px up to 8,000px per side and 40 megapixels.`,
        );
        return;
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = url;
      sourceImage.current = image;
      setSourceSize({ width: image.naturalWidth, height: image.naturalHeight });
      setFile(nextFile);
      setSourceName(nextFile.name);
      resetEdits();
      setOpen(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("The selected file could not be decoded as an image.");
    };
    image.src = url;
  }

  function editCurrentImage() {
    if (!currentImage?.src) return;
    setError("");
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (
        image.naturalWidth < minimumWidth ||
        image.naturalHeight < minimumHeight ||
        image.naturalWidth > maximumImageDimension ||
        image.naturalHeight > maximumImageDimension ||
        image.naturalWidth * image.naturalHeight > maximumImagePixels
      ) {
        setError(
          `The current image must be from ${minimumWidth} × ${minimumHeight}px up to 8,000px per side and 40 megapixels.`,
        );
        return;
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = "";
      sourceImage.current = image;
      setSourceSize({ width: image.naturalWidth, height: image.naturalHeight });
      setFile(null);
      setSourceName(currentImage.name || "current-image");
      resetEdits();
      setOpen(true);
    };
    image.onerror = () => {
      setError(
        "The current image could not be opened for editing. Upload a replacement instead.",
      );
    };
    image.src = currentImage.src;
  }

  async function uploadOriginal() {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      await onUpload(file);
      setProcessing(false);
      closeEditor(true);
    } catch {
      setProcessing(false);
      setError("The original image could not be uploaded.");
    }
  }

  async function applyEdits() {
    if (!sourceImage.current) return;
    setProcessing(true);
    setError("");
    try {
      if (
        !Number.isInteger(outputWidth) ||
        !Number.isInteger(outputHeight) ||
        outputWidth < minimumWidth ||
        outputHeight < minimumHeight
      ) {
        throw new Error("OUTPUT_TOO_SMALL");
      }
      if (
        outputWidth > maximumImageDimension ||
        outputHeight > maximumImageDimension ||
        outputWidth * outputHeight > maximumImagePixels
      ) {
        throw new Error("OUTPUT_TOO_LARGE_DIMENSIONS");
      }
      const canvas = renderEditedCanvas(outputWidth, outputHeight);
      let blob: Blob | undefined;
      for (const quality of [0.9, 0.78, 0.65, 0.52]) {
        blob = await canvasBlob(canvas, quality);
        if (blob.size <= maximumUploadBytes) break;
      }
      if (!blob || blob.size > maximumUploadBytes)
        throw new Error("OUTPUT_TOO_LARGE");
      const editedFile = new File([blob], editedName(sourceName), {
        type: "image/webp",
        lastModified: Date.now(),
      });
      await onUpload(editedFile);
      setProcessing(false);
      closeEditor(true);
    } catch (reason) {
      setProcessing(false);
      if (reason instanceof Error && reason.message === "OUTPUT_TOO_SMALL") {
        setError(
          `Set an output size of at least ${minimumWidth} × ${minimumHeight}px.`,
        );
      } else if (
        reason instanceof Error &&
        reason.message === "OUTPUT_TOO_LARGE_DIMENSIONS"
      ) {
        setError("Output is limited to 8,000px per side and 40 megapixels.");
      } else if (
        reason instanceof Error &&
        reason.message === "OUTPUT_TOO_LARGE"
      ) {
        setError(
          "This resolution cannot be compressed below 4 MB. Choose a smaller width or height.",
        );
      } else {
        setError("Unable to export this edit within the 4 MB limit.");
      }
    }
  }

  function rotateClockwise() {
    const nextRotation = ((rotation + 90) % 360) as Rotation;
    setRotation(nextRotation);
    if (aspect === "original") {
      setOutputWidth(outputHeight);
      setOutputHeight(outputWidth);
    }
  }

  return (
    <div className={styles.uploadEditorField}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(event) => {
          chooseFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
        disabled={disabled}
      />
      {currentImage?.src && (
        <button
          type="button"
          className={styles.editCurrentImageButton}
          onClick={editCurrentImage}
          disabled={disabled}
        >
          Edit current image
        </button>
      )}
      <span>{help}</span>
      {!open && error && <small className={styles.fieldError}>{error}</small>}

      {open && (
        <div className={styles.imageEditorBackdrop}>
          <section
            ref={dialog}
            className={styles.imageEditorDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
          >
            <header className={styles.imageEditorHeader}>
              <div>
                <p className={styles.eyebrow}>IMAGE EDITOR</p>
                <h2 id={`${inputId}-title`}>Prepare image</h2>
                <small>
                  Source: {sourceSize.width} × {sourceSize.height}px · Output:{" "}
                  {outputWidth} × {outputHeight}px
                </small>
              </div>
              <button
                ref={closeButton}
                type="button"
                onClick={() => closeEditor()}
                disabled={processing}
                aria-label="Close image editor"
              >
                ×
              </button>
            </header>

            <div className={styles.imageEditorBody}>
              <div className={styles.imageEditorPreview}>
                <canvas ref={previewCanvas} aria-label="Edited image preview" />
              </div>
              <div className={styles.imageEditorControls}>
                <label>
                  Crop ratio
                  <select
                    value={aspect}
                    onChange={(event) =>
                      changeAspect(event.target.value as AspectPreset)
                    }
                  >
                    <option value="original">Original</option>
                    <option value="1:1">Square · 1:1</option>
                    <option value="4:5">Portrait · 4:5</option>
                    <option value="9:16">Reel · 9:16</option>
                    <option value="16:9">Wide · 16:9</option>
                  </select>
                </label>
                <fieldset className={styles.editorResolution}>
                  <legend>Output resolution</legend>
                  <div className={styles.editorResolutionInputs}>
                    <label>
                      Width
                      <input
                        type="number"
                        min={minimumWidth}
                        max={maximumImageDimension}
                        step="1"
                        value={outputWidth}
                        onChange={(event) =>
                          setResolutionFromWidth(Number(event.target.value))
                        }
                      />
                    </label>
                    <span aria-hidden="true">×</span>
                    <label>
                      Height
                      <input
                        type="number"
                        min={minimumHeight}
                        max={maximumImageDimension}
                        step="1"
                        value={outputHeight}
                        onChange={(event) =>
                          setResolutionFromHeight(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <div className={styles.editorResolutionPresets}>
                    <button type="button" onClick={() => applyCropResolution()}>
                      Based on image
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolutionFromWidth(1280)}
                    >
                      1280px
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolutionFromWidth(1920)}
                    >
                      1920px
                    </button>
                  </div>
                  <small>
                    Width and height stay matched to the selected crop ratio.
                  </small>
                </fieldset>
                <button
                  type="button"
                  className={styles.editorToolButton}
                  onClick={rotateClockwise}
                >
                  Rotate 90°
                </button>
                <label className={styles.editorRange}>
                  Zoom <output>{zoom.toFixed(1)}×</output>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                </label>
                <label className={styles.editorRange}>
                  Horizontal position <output>{positionX}</output>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={positionX}
                    onChange={(event) =>
                      setPositionX(Number(event.target.value))
                    }
                  />
                </label>
                <label className={styles.editorRange}>
                  Vertical position <output>{positionY}</output>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={positionY}
                    onChange={(event) =>
                      setPositionY(Number(event.target.value))
                    }
                  />
                </label>
                <label className={styles.editorRange}>
                  Brightness <output>{brightness}%</output>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(event) =>
                      setBrightness(Number(event.target.value))
                    }
                  />
                </label>
                <label className={styles.editorRange}>
                  Contrast <output>{contrast}%</output>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(event) =>
                      setContrast(Number(event.target.value))
                    }
                  />
                </label>
                <label className={styles.editorRange}>
                  Saturation <output>{saturation}%</output>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={saturation}
                    onChange={(event) =>
                      setSaturation(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  type="button"
                  className={styles.editorResetButton}
                  onClick={resetEdits}
                  disabled={processing}
                >
                  Reset edits
                </button>
              </div>
            </div>

            {error && <p className={styles.editorError}>{error}</p>}
            <footer className={styles.imageEditorActions}>
              {file ? (
                <button
                  type="button"
                  onClick={uploadOriginal}
                  disabled={processing}
                >
                  Upload original
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => closeEditor()}
                  disabled={processing}
                >
                  Keep current image
                </button>
              )}
              <button type="button" onClick={applyEdits} disabled={processing}>
                {processing ? "Preparing…" : "Apply edits & upload"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
