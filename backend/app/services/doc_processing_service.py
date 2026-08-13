"""
LifeSphere Backend — Document Processing Service
Handles file type detection, PyMuPDF text extraction, scanned PDF page rendering,
and base64 image encoding for OCR / AI processing.
"""

import os
import logging
import base64
import aiofiles
from typing import Dict, Any, List

logger = logging.getLogger("lifesphere.doc_processing")

SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".csv"}


async def extract_file_content(file_path: str, filename: str) -> Dict[str, Any]:
    """
    Extracts content from an uploaded document.
    - PDF: Extracts text via PyMuPDF. If text < 40 chars, renders page 1 & 2 pixmaps as base64 images.
    - Images (PNG, JPG, JPEG, WEBP): Converts to base64 data URI string.
    - Text (TXT, CSV): Reads UTF-8 text string.
    
    Returns dict:
      {
        "success": bool,
        "filename": str,
        "extension": str,
        "mime_type": str,
        "text": str,
        "images": List[str],
        "is_scanned": bool,
        "error": str | None
      }
    """
    if not file_path or not os.path.exists(file_path):
        return {"success": False, "error": f"File not found on disk: {file_path}"}

    ext = os.path.splitext(filename or file_path)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return {
            "success": False,
            "error": f"Unsupported file type '{ext}'. Supported formats: PDF, PNG, JPG, JPEG, WEBP, TXT.",
        }

    try:
        # ─── 1. PDF Processing ──────────────────────────────────────────
        if ext == ".pdf":
            extracted_text = ""
            rendered_images: List[str] = []
            is_scanned = False

            try:
                import pymupdf as fitz  # PyMuPDF
            except ImportError:
                import fitz

            doc = fitz.open(file_path)
            for page in doc:
                extracted_text += page.get_text()

            extracted_text_clean = extracted_text.strip()

            # If text layer is missing or very sparse (<40 chars), treat as scanned PDF and render pixmaps
            if len(extracted_text_clean) < 40:
                is_scanned = True
                logger.info("PDF '%s' has minimal text (%d chars). Rendering page pixmaps for OCR...", filename, len(extracted_text_clean))
                for page_num in range(min(len(doc), 3)):  # Render up to first 3 pages
                    page = doc.load_page(page_num)
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    b64_str = base64.b64encode(img_bytes).decode("utf-8")
                    rendered_images.append(f"data:image/png;base64,{b64_str}")
            doc.close()

            return {
                "success": True,
                "filename": filename,
                "extension": ext,
                "mime_type": "application/pdf",
                "text": extracted_text_clean,
                "images": rendered_images,
                "is_scanned": is_scanned,
                "error": None,
            }

        # ─── 2. Image Processing (PNG, JPG, JPEG, WEBP) ────────────────
        elif ext in {".png", ".jpg", ".jpeg", ".webp"}:
            mime_map = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
            }
            mime_type = mime_map.get(ext, "image/jpeg")

            async with aiofiles.open(file_path, "rb") as f:
                content_bytes = await f.read()

            b64_str = base64.b64encode(content_bytes).decode("utf-8")
            data_uri = f"data:{mime_type};base64,{b64_str}"

            # Attempt basic PyMuPDF text extraction from image if supported
            extracted_text = ""
            try:
                import pymupdf as fitz
                doc = fitz.open(file_path)
                for page in doc:
                    extracted_text += page.get_text()
                doc.close()
            except Exception:
                pass

            return {
                "success": True,
                "filename": filename,
                "extension": ext,
                "mime_type": mime_type,
                "text": extracted_text.strip(),
                "images": [data_uri],
                "is_scanned": True,
                "error": None,
            }

        # ─── 3. Text Files (TXT, CSV) ───────────────────────────────────
        elif ext in {".txt", ".csv"}:
            async with aiofiles.open(file_path, "r", encoding="utf-8", errors="replace") as f:
                text_content = await f.read()

            return {
                "success": True,
                "filename": filename,
                "extension": ext,
                "mime_type": "text/plain" if ext == ".txt" else "text/csv",
                "text": text_content.strip(),
                "images": [],
                "is_scanned": False,
                "error": None,
            }

    except Exception as e:
        logger.exception("Error extracting document content from '%s': %s", filename, e)
        return {"success": False, "error": f"Document extraction failed: {str(e)}"}

    return {"success": False, "error": "Unknown document extraction state"}
