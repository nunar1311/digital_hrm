"""
AI Request Queue Manager - Concurrency control cho AI API calls
Su dung asyncio.Semaphore de gioi han so luong concurrent requests toi AI Gateway.
Tranh qua tai API, dam bao fair access cho 100+ users.
"""

import asyncio
import logging
import time
from typing import Any, Coroutine, Optional
from dataclasses import dataclass, field
from collections import deque

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class QueueMetrics:
    """Metrics theo doi tinh trang queue"""
    total_requests: int = 0
    completed_requests: int = 0
    failed_requests: int = 0
    timeout_requests: int = 0
    active_requests: int = 0
    queue_depth: int = 0
    avg_wait_time_ms: float = 0.0
    avg_process_time_ms: float = 0.0
    peak_concurrent: int = 0

    # Rolling window for calculating averages
    _wait_times: deque = field(default_factory=lambda: deque(maxlen=100))
    _process_times: deque = field(default_factory=lambda: deque(maxlen=100))

    def record_wait(self, wait_ms: float):
        self._wait_times.append(wait_ms)
        self.avg_wait_time_ms = sum(self._wait_times) / len(self._wait_times) if self._wait_times else 0

    def record_process(self, process_ms: float):
        self._process_times.append(process_ms)
        self.avg_process_time_ms = sum(self._process_times) / len(self._process_times) if self._process_times else 0

    def to_dict(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "completed_requests": self.completed_requests,
            "failed_requests": self.failed_requests,
            "timeout_requests": self.timeout_requests,
            "active_requests": self.active_requests,
            "queue_depth": self.queue_depth,
            "peak_concurrent": self.peak_concurrent,
            "avg_wait_time_ms": round(self.avg_wait_time_ms, 2),
            "avg_process_time_ms": round(self.avg_process_time_ms, 2),
        }


class AIRequestQueue:
    """
    Manages concurrent AI API requests with semaphore-based throttling.

    Features:
    - Semaphore gioi han concurrent calls (default: 20)
    - Timeout cho requests cho qua lau trong queue
    - Metrics tracking
    - Graceful degradation
    """

    def __init__(self, max_concurrent: Optional[int] = None):
        settings = get_settings()
        self._max_concurrent = max_concurrent or settings.max_concurrent_ai_calls
        self._semaphore = asyncio.Semaphore(self._max_concurrent)
        self.metrics = QueueMetrics()

        logger.info(f"AI Request Queue initialized: max_concurrent={self._max_concurrent}")

    async def execute(
        self,
        coroutine: Coroutine,
        timeout: float = 90.0,
        request_id: Optional[str] = None,
    ) -> Any:
        """
        Execute an AI request through the queue.

        Args:
            coroutine: The async function to execute (AI API call)
            timeout: Max seconds to wait (queue + execution)
            request_id: Optional ID for logging

        Returns:
            Result of the coroutine

        Raises:
            QueueTimeoutError: If request times out waiting in queue
            QueueOverloadError: If queue is completely full
        """
        req_id = request_id or f"req_{self.metrics.total_requests}"
        self.metrics.total_requests += 1
        self.metrics.queue_depth += 1

        enqueue_time = time.time()

        try:
            # Wait for semaphore with timeout
            try:
                async with asyncio.timeout(timeout):
                    await self._semaphore.acquire()
            except asyncio.TimeoutError:
                self.metrics.timeout_requests += 1
                self.metrics.queue_depth -= 1
                wait_ms = (time.time() - enqueue_time) * 1000
                logger.warning(
                    f"[{req_id}] Queue timeout after {wait_ms:.0f}ms "
                    f"(active={self.metrics.active_requests}, queue={self.metrics.queue_depth})"
                )
                raise QueueTimeoutError(
                    f"Hệ thống AI đang bận ({self.metrics.active_requests} requests đang xử lý). "
                    f"Vui lòng thử lại sau vài giây."
                )

            # Acquired semaphore - now executing
            wait_ms = (time.time() - enqueue_time) * 1000
            self.metrics.record_wait(wait_ms)
            self.metrics.queue_depth -= 1
            self.metrics.active_requests += 1

            if self.metrics.active_requests > self.metrics.peak_concurrent:
                self.metrics.peak_concurrent = self.metrics.active_requests

            if wait_ms > 100:  # Only log if waited meaningfully
                logger.info(
                    f"[{req_id}] Acquired after {wait_ms:.0f}ms wait "
                    f"(active={self.metrics.active_requests}/{self._max_concurrent})"
                )

            # Execute the actual AI call
            exec_start = time.time()
            try:
                result = await coroutine
                exec_ms = (time.time() - exec_start) * 1000
                self.metrics.record_process(exec_ms)
                self.metrics.completed_requests += 1

                logger.debug(f"[{req_id}] Completed in {exec_ms:.0f}ms")
                return result

            except Exception as e:
                self.metrics.failed_requests += 1
                exec_ms = (time.time() - exec_start) * 1000
                logger.error(f"[{req_id}] Failed after {exec_ms:.0f}ms: {e}")
                raise

            finally:
                self.metrics.active_requests -= 1
                self._semaphore.release()

        except QueueTimeoutError:
            raise
        except Exception:
            self.metrics.queue_depth = max(0, self.metrics.queue_depth - 1)
            raise

    @property
    def is_busy(self) -> bool:
        """Check if queue is near capacity"""
        return self.metrics.active_requests >= self._max_concurrent * 0.8

    @property
    def utilization(self) -> float:
        """Current utilization percentage"""
        return (self.metrics.active_requests / self._max_concurrent) * 100 if self._max_concurrent > 0 else 0

    def get_status(self) -> dict:
        """Get current queue status"""
        return {
            "max_concurrent": self._max_concurrent,
            "active": self.metrics.active_requests,
            "queued": self.metrics.queue_depth,
            "utilization_pct": round(self.utilization, 1),
            "is_busy": self.is_busy,
            "metrics": self.metrics.to_dict(),
        }


class QueueTimeoutError(Exception):
    """Raised when a request times out waiting in the queue"""
    pass


class QueueOverloadError(Exception):
    """Raised when the queue is completely overloaded"""
    pass


# =====================
# Singleton Management
# =====================

_ai_queue: Optional[AIRequestQueue] = None


def get_ai_queue() -> AIRequestQueue:
    """Get AI request queue singleton"""
    global _ai_queue
    if _ai_queue is None:
        _ai_queue = AIRequestQueue()
    return _ai_queue


def reset_ai_queue():
    """Reset AI request queue"""
    global _ai_queue
    _ai_queue = None
