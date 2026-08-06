"""One-off maintenance script: re-embeds every DocumentChunk with the
currently configured embedding model (see app.core.config.embedding_model).

Needed whenever the embedding model changes -- embeddings from different
models live in incompatible vector spaces, so cosine similarity between an
old-model chunk and a new-model query is meaningless. Run once after any
such change:

    python scripts/reembed_documents.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.document import DocumentChunk
from app.rag.embeddings import embed_texts

BATCH_SIZE = 64


def main():
    db = SessionLocal()
    try:
        chunks = db.query(DocumentChunk).order_by(DocumentChunk.id).all()
        total = len(chunks)
        print(f"Re-embedding {total} document chunks...")
        for start in range(0, total, BATCH_SIZE):
            batch = chunks[start:start + BATCH_SIZE]
            embeddings = embed_texts([c.content for c in batch])
            for chunk, emb in zip(batch, embeddings):
                chunk.embedding_json = json.dumps(emb)
            db.commit()
            print(f"  {min(start + BATCH_SIZE, total)}/{total}")
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
