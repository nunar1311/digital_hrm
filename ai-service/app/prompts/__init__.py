"""
Prompts - Prompt registry and module-specific prompts
"""

from app.prompts.registry import PromptRegistry, get_prompt_registry

__all__ = [
    "PromptRegistry",
    "get_prompt_registry",
]
