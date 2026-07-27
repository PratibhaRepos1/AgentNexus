from pydantic import BaseModel
from typing import List


class TopQuestion(BaseModel):
    question: str
    count: int


class AnalyticsSummary(BaseModel):
    conversation_count: int
    lead_count: int
    message_count: int
    top_questions: List[TopQuestion]
