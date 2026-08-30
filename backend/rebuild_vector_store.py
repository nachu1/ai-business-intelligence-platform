import asyncio
import os
import fitz

from app.database.mongodb import document_collection
from app.ai.langchain_vectordb import vector_store
from app.ai.text_splitter import split_text
from langchain_core.documents import Document


async def rebuild_vector_store():

    print("Starting vector store rebuild...")

    documents = await document_collection.find({}).to_list(
        length=None
    )

    if not documents:
        print("No documents found in MongoDB.")
        return

    total_chunks = 0

    for document in documents:

        document_id = str(document["_id"])
        file_path = document.get("storage_path")

        print(
            f"\nProcessing: "
            f"{document.get('original_filename')}"
        )

        if not file_path or not os.path.exists(file_path):
            print(
                f"File not found: {file_path}"
            )
            continue

        try:
            # ---------------------------------------------
            # EXTRACT TEXT
            # ---------------------------------------------

            pdf = fitz.open(file_path)

            text = ""

            for page in pdf:
                text += page.get_text()

            pdf.close()

            if not text.strip():
                print("No text found. Skipping.")
                continue

            # ---------------------------------------------
            # SPLIT TEXT
            # ---------------------------------------------

            chunks = split_text(text)

            print(
                f"Chunks created: {len(chunks)}"
            )

            # ---------------------------------------------
            # CREATE CHROMA DOCUMENTS
            # ---------------------------------------------

            chroma_documents = []
            ids = []

            for index, chunk in enumerate(chunks):

                metadata = {
                    "document_id": document_id,

                    "company_id": str(
                        document["company_id"]
                    ),

                    "chunk_number": index,

                    "document_type": document.get(
                        "document_type",
                        "other",
                    ),

                    "source": document.get(
                        "original_filename",
                        "Unknown document",
                    ),
                }

                if document.get("uploaded_by"):
                    metadata["uploaded_by"] = str(
                        document["uploaded_by"]
                    )

                if document.get("department_id"):
                    metadata["department_id"] = str(
                        document["department_id"]
                    )

                chroma_documents.append(
                    Document(
                        page_content=chunk,
                        metadata=metadata,
                    )
                )

                ids.append(
                    f"{document_id}_{index}"
                )

            # ---------------------------------------------
            # ADD TO CHROMA
            # ---------------------------------------------

            vector_store.add_documents(
                documents=chroma_documents,
                ids=ids,
            )

            total_chunks += len(chunks)

            print(
                f"Indexed: "
                f"{document.get('original_filename')}"
            )

        except Exception as error:

            print(
                f"Failed to process "
                f"{document.get('original_filename')}: "
                f"{error}"
            )

    print("\n================================")
    print("Vector store rebuild completed.")
    print(f"Total chunks indexed: {total_chunks}")
    print("================================")


if __name__ == "__main__":
    asyncio.run(
        rebuild_vector_store()
    )