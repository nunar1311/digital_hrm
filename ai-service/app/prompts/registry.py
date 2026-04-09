"""
Prompt Registry - Centralized prompt management for all HR modules
"""

import logging
from typing import Dict, Any, Optional, List
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)


class PromptRegistry:
    """Central registry for all AI prompts across HR modules"""

    def __init__(self):
        self.prompts = self._load_all_prompts()

    def _load_all_prompts(self) -> Dict[str, Dict[str, str]]:
        """Load all prompts from all module files"""
        prompts = {}

        # Load prompts from each module
        from app.prompts import (
            employee_prompts,
            attendance_prompts,
            payroll_prompts,
            recruitment_prompts,
            contract_prompts,
            onboarding_prompts,
            offboarding_prompts,
            dashboard_prompts,
            ess_prompts,
            org_chart_prompts,
            asset_prompts,
            notification_prompts,
        )

        modules = [
            employee_prompts,
            attendance_prompts,
            payroll_prompts,
            recruitment_prompts,
            contract_prompts,
            onboarding_prompts,
            offboarding_prompts,
            dashboard_prompts,
            ess_prompts,
            org_chart_prompts,
            asset_prompts,
            notification_prompts,
        ]

        for module in modules:
            if hasattr(module, "PROMPTS"):
                prompts.update(module.PROMPTS)

        return prompts

    def get(self, prompt_key: str, **kwargs) -> str:
        """
        Get a prompt by key and format with kwargs

        Args:
            prompt_key: Dot-separated prompt key (e.g., "employee.extract_from_resume")
            **kwargs: Variables to format the prompt

        Returns:
            Formatted prompt string
        """
        prompt = self.prompts.get(prompt_key, "")

        if not prompt:
            logger.warning(f"Prompt key not found: {prompt_key}")
            return ""

        if kwargs:
            try:
                prompt = prompt.format(**kwargs)
            except KeyError as e:
                logger.warning(f"Missing template variable: {e}")

        return prompt

    def get_system_prompt(self, module: str) -> str:
        """
        Get system prompt for a module

        Args:
            module: Module name (employee, attendance, payroll, etc.)

        Returns:
            System prompt string
        """
        key = f"{module}.system"
        return self.get(key) or self._get_default_system_prompt(module)

    def _get_default_system_prompt(self, module: str) -> str:
        """Get default system prompt if not defined"""
        defaults = {
            "employee": "Bạn là chuyên gia nhân sự với kiến thức sâu về quản lý nhân viên, tuyển dụng, và phát triển con người.",
            "attendance": "Bạn là chuyên gia về quản lý chấm công và thời gian làm việc.",
            "payroll": "Bạn là chuyên gia về lương, thuế, bảo hiểm và phúc lợi nhân viên.",
            "recruitment": "Bạn là chuyên gia tuyển dụng với kinh nghiệm sâu về đánh giá ứng viên.",
            "contract": "Bạn là chuyên gia về luật lao động và quản lý hợp đồng lao động Việt Nam.",
            "onboarding": "Bạn là chuyên gia về quy trình đón tiếp và đào tạo nhân viên mới.",
            "offboarding": "Bạn là chuyên gia về quản lý nghỉ việc và kiến thức bàn giao.",
            "dashboard": "Bạn là chuyên gia phân tích dữ liệu nhân sự và tạo báo cáo.",
            "ess": "Bạn là trợ lý HR thân thiện, giúp đỡ nhân viên về các câu hỏi liên quan đến công việc.",
            "org_chart": "Bạn là chuyên gia về cấu trúc tổ chức và quản lý nhân sự cấp cao.",
            "asset": "Bạn là chuyên gia về quản lý tài sản doanh nghiệp.",
            "notification": "Bạn là chuyên gia về hệ thống thông báo và giao tiếp nội bộ.",
        }
        return defaults.get(
            module,
            "Bạn là trợ lý AI chuyên về nhân sự cho doanh nghiệp Việt Nam.",
        )

    def list_prompts(self, module: Optional[str] = None) -> List[str]:
        """
        List all available prompt keys

        Args:
            module: Optional filter by module

        Returns:
            List of prompt keys
        """
        if module:
            prefix = f"{module}."
            return [k for k in self.prompts.keys() if k.startswith(prefix)]
        return list(self.prompts.keys())


# Singleton instance
_prompt_registry: Optional[PromptRegistry] = None


def get_prompt_registry() -> PromptRegistry:
    """Get prompt registry singleton"""
    global _prompt_registry
    if _prompt_registry is None:
        _prompt_registry = PromptRegistry()
    return _prompt_registry
