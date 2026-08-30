from typing import Literal

from pydantic import BaseModel


class Route(BaseModel):
    route: Literal[
        "rag",
        "general",
        "company",
    ]