"""
Token Counter - Estimate and track token usage
"""

import logging
from typing import List, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class TokenCounter:
    """Token counter for AI API usage estimation"""

    # Approximate tokens per character (varies by model)
    # These are rough estimates
    TOKENS_PER_CHAR_EN = 0.25  # English text ~4 chars per token
    TOKENS_PER_CHAR_VI = 0.35  # Vietnamese text has more special chars

    def __init__(self):
        self.total_tokens = 0
        self.total_cost = 0.0

        # Cost per 1M tokens (approximate, update as needed)
        self.cost_per_million = {
            "gpt-4o": 2.5,  # $2.5 per 1M input tokens
            "gpt-4o-mini": 0.15,  # $0.15 per 1M input tokens
            "gpt-4-turbo": 10.0,  # $10 per 1M input tokens
            "gpt-3.5-turbo": 0.5,  # $0.50 per 1M input tokens
            "claude-3-5-sonnet-20241022": 3.0,  # $3 per 1M input tokens
            "claude-3-opus-20240229": 15.0,  # $15 per 1M input tokens
            "gemini-2.0-flash": 0.0,  # Gemini 2.0 is free tier
            "gemini-1.5-pro": 1.25,  # $1.25 per 1M input tokens
        }

    def count_text(self, text: str) -> int:
        """
        Estimate token count for text

        Args:
            text: Text to count

        Returns:
            Estimated token count
        """
        if not text:
            return 0

        # Use tiktoken if available (more accurate)
        try:
            import tiktoken

            encoding = tiktoken.encoding_for_model("gpt-4o")
            return len(encoding.encode(text))
        except ImportError:
            pass
        except Exception:
            pass

        # Fallback to character-based estimation
        # Detect language (rough heuristic)
        vietnamese_chars = sum(1 for c in text if "\u00c0" <= c <= "\u1ef3" or "đ" <= c <= "Đ")
        vietnamese_ratio = vietnamese_chars / max(len(text), 1)

        if vietnamese_ratio > 0.1:
            # Likely Vietnamese text
            return int(len(text) * self.TOKENS_PER_CHAR_VI)
        else:
            # Default to English estimation
            return int(len(text) * self.TOKENS_PER_CHAR_EN)

    def count_messages(self, messages: List[Dict[str, str]]) -> int:
        """
        Estimate token count for a list of messages

        Args:
            messages: List of messages with 'role' and 'content'

        Returns:
            Estimated total token count
        """
        total = 0

        # Add overhead per message (role tokens, formatting)
        overhead_per_message = 4

        for msg in messages:
            content = msg.get("content", "")
            total += self.count_text(content)
            total += overhead_per_message

        # Add overhead for message array structure
        total += 3

        return total

    def estimate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
    ) -> float:
        """
        Estimate cost for API call

        Args:
            prompt_tokens: Input token count
            completion_tokens: Output token count
            model: Model name

        Returns:
            Estimated cost in USD
        """
        cost = self.cost_per_million.get(model, 0.0)

        # Input cost + Output cost (output is typically 2-3x more expensive)
        # For simplicity, use same rate for both
        total_tokens = prompt_tokens + completion_tokens
        return (total_tokens / 1_000_000) * cost

    def track_usage(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
    ) -> Dict[str, Any]:
        """
        Track token usage and update totals

        Args:
            prompt_tokens: Input token count
            completion_tokens: Output token count
            model: Model name

        Returns:
            Usage statistics
        """
        total_tokens = prompt_tokens + completion_tokens
        cost = self.estimate_cost(prompt_tokens, completion_tokens, model)

        self.total_tokens += total_tokens
        self.total_cost += cost

        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "estimated_cost_usd": cost,
            "cumulative_tokens": self.total_tokens,
            "cumulative_cost_usd": self.total_cost,
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get current usage statistics"""
        return {
            "total_tokens": self.total_tokens,
            "total_cost_usd": round(self.total_cost, 4),
            "cost_per_million": self.cost_per_million,
        }

    def reset(self):
        """Reset counters"""
        self.total_tokens = 0
        self.total_cost = 0.0


# Singleton instance
_token_counter: TokenCounter = None


def get_token_counter() -> TokenCounter:
    """Get token counter singleton"""
    global _token_counter
    if _token_counter is None:
        _token_counter = TokenCounter()
    return _token_counter


def count_tokens(text: str) -> int:
    """Quick function to count tokens in text"""
    return get_token_counter().count_text(text)
