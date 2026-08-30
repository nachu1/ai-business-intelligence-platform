import fitz
import pytesseract

from PIL import Image
from io import BytesIO


TESSERACT_PATH = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

pytesseract.pytesseract.tesseract_cmd = (
    TESSERACT_PATH
)


def ocr_page(
    page,
) -> str:
    pixmap = page.get_pixmap(
        matrix=fitz.Matrix(2, 2),
        alpha=False,
    )

    image = Image.open(
        BytesIO(pixmap.tobytes("png"))
    )

    text = pytesseract.image_to_string(
        image,
        lang="eng",
    )

    return text.strip()


def extract_text_with_ocr(
    file_path: str,
) -> str:
    text_parts = []

    doc = fitz.open(
        file_path
    )

    for page_number, page in enumerate(
        doc,
        start=1,
    ):
        print(
            f"OCR processing page {page_number}"
        )

        text = ocr_page(
            page
        )

        if text:
            text_parts.append(
                text
            )

    doc.close()

    return "\n\n".join(
        text_parts
    )