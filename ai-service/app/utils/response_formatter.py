"""
Response Formatter - Standardized AI response formatting
"""

import logging
from typing import Any, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ResponseFormatter:
    """Format AI responses in a standardized structure"""

    @staticmethod
    def success(
        content: Any,
        metadata: Optional[Dict[str, Any]] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        usage: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format a successful AI response

        Args:
            content: The AI generated content
            metadata: Additional metadata
            provider: AI provider used
            model: Model used
            usage: Token usage information

        Returns:
            Formatted response dict
        """
        response = {
            "success": True,
            "content": content,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if metadata:
            response["metadata"] = metadata

        if provider:
            response["provider"] = provider

        if model:
            response["model"] = model

        if usage:
            response["usage"] = usage

        return response

    @staticmethod
    def error(
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Any] = None,
        provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Format an error AI response

        Args:
            message: Error message
            error_code: Optional error code
            details: Additional error details
            provider: AI provider if available

        Returns:
            Formatted error response dict
        """
        response = {
            "success": False,
            "error": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if error_code:
            response["error_code"] = error_code

        if details:
            response["details"] = details

        if provider:
            response["provider"] = provider

        return response

    @staticmethod
    def stream_chunk(
        content: str,
        chunk_index: int = 0,
        is_final: bool = False,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format a streaming response chunk

        Args:
            content: Chunk content
            chunk_index: Index of this chunk
            is_final: Whether this is the final chunk
            metadata: Additional metadata

        Returns:
            Formatted chunk response
        """
        chunk = {
            "type": "chunk",
            "content": content,
            "index": chunk_index,
            "final": is_final,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if metadata:
            chunk["metadata"] = metadata

        return chunk

    @staticmethod
    def paginated(
        items: list,
        page: int = 1,
        page_size: int = 20,
        total: Optional[int] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format a paginated response

        Args:
            items: List of items
            page: Current page number
            page_size: Items per page
            total: Total number of items
            metadata: Additional metadata

        Returns:
            Formatted paginated response
        """
        response = {
            "success": True,
            "data": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total or len(items),
                "total_pages": (total or len(items) + page_size - 1) // page_size,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if metadata:
            response["metadata"] = metadata

        return response

    @staticmethod
    def analysis(
        insights: list,
        summary: Optional[str] = None,
        recommendations: Optional[list] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format an analysis response

        Args:
            insights: List of insights
            summary: Overall summary
            recommendations: List of recommendations
            metadata: Additional metadata

        Returns:
            Formatted analysis response
        """
        response = {
            "success": True,
            "analysis": {
                "insights": insights,
                "summary": summary,
                "recommendations": recommendations or [],
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if metadata:
            response["metadata"] = metadata

        return response

    @staticmethod
    def extraction(
        extracted_data: Dict[str, Any],
        confidence: Optional[float] = None,
        warnings: Optional[list] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format a data extraction response

        Args:
            extracted_data: Extracted structured data
            confidence: Confidence score (0-1)
            warnings: List of warnings
            metadata: Additional metadata

        Returns:
            Formatted extraction response
        """
        response = {
            "success": True,
            "data": extracted_data,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        if warnings:
            response["warnings"] = warnings

        if metadata:
            response["metadata"] = metadata

        return response


# Utility functions for quick formatting
def format_success(content: Any, **kwargs) -> Dict[str, Any]:
    """Quick format success response"""
    return ResponseFormatter.success(content, **kwargs)


def format_error(message: str, **kwargs) -> Dict[str, Any]:
    """Quick format error response"""
    return ResponseFormatter.error(message, **kwargs)
