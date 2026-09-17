from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional
from datetime import date


def quantize_khr(val: Decimal) -> Decimal:
    """Rounds to nearest whole KHR (or 2 decimal places if needed, standard Cambodian payroll rounds to whole KHR or standard cents)."""
    return val.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def quantize_usd(val: Decimal) -> Decimal:
    """Rounds to 2 decimal places for USD."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# Standard Cambodia GDT Tax on Salary Default Progressive Brackets
DEFAULT_CAMBODIA_TOS_BRACKETS = [
    {"min_khr": Decimal("0"), "max_khr": Decimal("1500000"), "rate": Decimal("0.00")},
    {"min_khr": Decimal("1500001"), "max_khr": Decimal("2000000"), "rate": Decimal("0.05")},
    {"min_khr": Decimal("2000001"), "max_khr": Decimal("8500000"), "rate": Decimal("0.10")},
    {"min_khr": Decimal("8500001"), "max_khr": Decimal("12500000"), "rate": Decimal("0.15")},
    {"min_khr": Decimal("12500001"), "max_khr": None, "rate": Decimal("0.20")},
]


class CambodiaPayrollCalculator:
    """
    Deterministic calculation engine for Cambodia Enterprise Payroll.
    Handles Multi-currency (USD/KHR), Cambodia Labor Law rules, NSSF, and GDT Tax on Salary.
    """

    @classmethod
    def calculate_nssf(
        cls,
        gross_salary_khr: Decimal,
        wage_floor_khr: Decimal = Decimal("400000"),
        wage_ceiling_khr: Decimal = Decimal("1200000"),
        pension_rate_employer: Decimal = Decimal("0.02"),
        pension_rate_employee: Decimal = Decimal("0.02"),
        health_rate_employer: Decimal = Decimal("0.026"),
        accident_rate_employer: Decimal = Decimal("0.008"),
    ) -> Dict[str, Any]:
        """Calculates statutory NSSF contributions."""
        contributory_wage = min(wage_ceiling_khr, max(wage_floor_khr, gross_salary_khr))

        pension_emp = quantize_khr(contributory_wage * pension_rate_employee)
        pension_empr = quantize_khr(contributory_wage * pension_rate_employer)
        health_empr = quantize_khr(contributory_wage * health_rate_employer)
        accident_empr = quantize_khr(contributory_wage * accident_rate_employer)

        return {
            "contributory_wage_khr": contributory_wage,
            "pension_employee_khr": pension_emp,
            "pension_employer_khr": pension_empr,
            "health_employer_khr": health_empr,
            "accident_employer_khr": accident_empr,
            "total_employer_nssf_khr": pension_empr + health_empr + accident_empr,
        }

    @classmethod
    def calculate_tax_on_salary(
        cls,
        taxable_salary_khr: Decimal,
        spouse_dependent_count: int = 0,
        minor_children_count: int = 0,
        dependent_rebate_khr: Decimal = Decimal("150000"),
        is_resident: bool = True,
        brackets: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Calculates Cambodia Tax on Salary (ToS) using GDT progressive tax brackets.
        Non-residents are taxed at a flat 20% without rebates.
        """
        if not is_resident:
            tax = quantize_khr(taxable_salary_khr * Decimal("0.20"))
            return {
                "tax_base_salary_khr": taxable_salary_khr,
                "dependent_relief_khr": Decimal("0"),
                "tax_on_salary_khr": tax,
                "bracket_breakdown": [{"rate": "20%", "tax": str(tax)}],
            }

        total_dependents = max(0, spouse_dependent_count) + max(0, minor_children_count)
        dependent_relief = Decimal(total_dependents) * dependent_rebate_khr
        tax_base = max(Decimal("0"), taxable_salary_khr - dependent_relief)

        active_brackets = brackets or DEFAULT_CAMBODIA_TOS_BRACKETS
        tax_total = Decimal("0")
        breakdown = []

        # Standard Cambodia cumulative bracket calculation
        for b in active_brackets:
            b_min = b["min_khr"]
            b_max = b["max_khr"]
            rate = b["rate"]

            if tax_base <= b_min:
                continue

            if b_max is not None:
                taxable_in_bracket = min(tax_base, b_max) - (b_min - Decimal("1") if b_min > 0 else Decimal("0"))
            else:
                taxable_in_bracket = tax_base - (b_min - Decimal("1"))

            if taxable_in_bracket > 0:
                bracket_tax = taxable_in_bracket * rate
                tax_total += bracket_tax
                breakdown.append({
                    "range": f"{b_min} - {b_max or 'above'}",
                    "rate": str(rate),
                    "amount_in_bracket": str(quantize_khr(taxable_in_bracket)),
                    "tax": str(quantize_khr(bracket_tax)),
                })

        final_tax = quantize_khr(tax_total)
        return {
            "tax_base_salary_khr": quantize_khr(tax_base),
            "dependent_relief_khr": quantize_khr(dependent_relief),
            "tax_on_salary_khr": final_tax,
            "bracket_breakdown": breakdown,
        }

    @classmethod
    def calculate_overtime_pay(
        cls,
        base_salary_khr: Decimal,
        overtime_hours: Decimal,
        multiplier: Decimal = Decimal("1.5"),
        standard_monthly_days: Decimal = Decimal("26"),
        daily_hours: Decimal = Decimal("8"),
    ) -> Decimal:
        """Calculates overtime pay according to Cambodia Labor Law standards."""
        if overtime_hours <= 0:
            return Decimal("0")
        hourly_rate = (base_salary_khr / standard_monthly_days) / daily_hours
        ot_pay = overtime_hours * hourly_rate * multiplier
        return quantize_khr(ot_pay)

    @classmethod
    def compute_employee_payroll(
        cls,
        base_salary_contract: Decimal,
        currency_contract: str,
        exchange_rate_usd_to_khr: Decimal = Decimal("4100"),
        worked_days: Decimal = Decimal("26"),
        total_monthly_days: Decimal = Decimal("26"),
        unpaid_absence_days: Decimal = Decimal("0"),
        overtime_hours_150: Decimal = Decimal("0"),
        overtime_hours_200: Decimal = Decimal("0"),
        allowances_khr: Decimal = Decimal("0"),
        bonuses_khr: Decimal = Decimal("0"),
        loan_deductions_khr: Decimal = Decimal("0"),
        other_deductions_khr: Decimal = Decimal("0"),
        spouse_dependent_count: int = 0,
        minor_children_count: int = 0,
        is_resident: bool = True,
    ) -> Dict[str, Any]:
        """Full deterministic payroll calculation for a single employee."""
        # Convert base salary to KHR if contract is in USD
        if currency_contract.upper() == "USD":
            base_salary_khr = quantize_khr(base_salary_contract * exchange_rate_usd_to_khr)
        else:
            base_salary_khr = quantize_khr(base_salary_contract)

        # Prorated earned salary (subtract unpaid absences)
        if total_monthly_days > 0 and unpaid_absence_days > 0:
            unpaid_deduction = (base_salary_khr / total_monthly_days) * unpaid_absence_days
            earned_base_salary_khr = quantize_khr(max(Decimal("0"), base_salary_khr - unpaid_deduction))
        else:
            earned_base_salary_khr = base_salary_khr

        # Overtime
        ot_150 = cls.calculate_overtime_pay(base_salary_khr, overtime_hours_150, Decimal("1.5"))
        ot_200 = cls.calculate_overtime_pay(base_salary_khr, overtime_hours_200, Decimal("2.0"))
        total_ot_pay_khr = ot_150 + ot_200

        # Gross Salary
        gross_salary_khr = earned_base_salary_khr + total_ot_pay_khr + allowances_khr + bonuses_khr

        # NSSF Calculations
        nssf_data = cls.calculate_nssf(gross_salary_khr)

        # Tax on Salary Calculation (Employee NSSF pension contribution is deductible from taxable salary base under GDT)
        taxable_salary_khr = max(Decimal("0"), gross_salary_khr - nssf_data["pension_employee_khr"])
        tax_data = cls.calculate_tax_on_salary(
            taxable_salary_khr=taxable_salary_khr,
            spouse_dependent_count=spouse_dependent_count,
            minor_children_count=minor_children_count,
            is_resident=is_resident,
        )

        # Total Deductions
        total_deductions_khr = (
            nssf_data["pension_employee_khr"]
            + tax_data["tax_on_salary_khr"]
            + loan_deductions_khr
            + other_deductions_khr
        )

        # Net Salary
        net_salary_khr = max(Decimal("0"), gross_salary_khr - total_deductions_khr)
        net_salary_usd = quantize_usd(net_salary_khr / exchange_rate_usd_to_khr)

        # Build Explainable Snapshot
        snapshot = {
            "inputs": {
                "base_salary_contract": str(base_salary_contract),
                "currency_contract": currency_contract,
                "exchange_rate": str(exchange_rate_usd_to_khr),
                "worked_days": str(worked_days),
                "unpaid_absence_days": str(unpaid_absence_days),
                "overtime_hours_150": str(overtime_hours_150),
                "overtime_hours_200": str(overtime_hours_200),
            },
            "earnings": {
                "earned_base_salary_khr": str(earned_base_salary_khr),
                "overtime_150_khr": str(ot_150),
                "overtime_200_khr": str(ot_200),
                "total_overtime_khr": str(total_ot_pay_khr),
                "allowances_khr": str(allowances_khr),
                "bonuses_khr": str(bonuses_khr),
                "gross_salary_khr": str(gross_salary_khr),
            },
            "nssf": {
                "contributory_wage_khr": str(nssf_data["contributory_wage_khr"]),
                "pension_employee_khr": str(nssf_data["pension_employee_khr"]),
                "pension_employer_khr": str(nssf_data["pension_employer_khr"]),
                "health_employer_khr": str(nssf_data["health_employer_khr"]),
                "accident_employer_khr": str(nssf_data["accident_employer_khr"]),
            },
            "tax": {
                "taxable_salary_khr": str(taxable_salary_khr),
                "dependent_relief_khr": str(tax_data["dependent_relief_khr"]),
                "tax_base_salary_khr": str(tax_data["tax_base_salary_khr"]),
                "tax_on_salary_khr": str(tax_data["tax_on_salary_khr"]),
                "breakdown": tax_data["bracket_breakdown"],
            },
            "deductions": {
                "nssf_employee_khr": str(nssf_data["pension_employee_khr"]),
                "tax_on_salary_khr": str(tax_data["tax_on_salary_khr"]),
                "loan_deductions_khr": str(loan_deductions_khr),
                "other_deductions_khr": str(other_deductions_khr),
                "total_deductions_khr": str(total_deductions_khr),
            },
            "net": {
                "net_salary_khr": str(net_salary_khr),
                "net_salary_usd": str(net_salary_usd),
            }
        }

        return {
            "gross_salary_khr": gross_salary_khr,
            "base_salary_earned_khr": earned_base_salary_khr,
            "total_overtime_pay_khr": total_ot_pay_khr,
            "nssf_contributory_wage_khr": nssf_data["contributory_wage_khr"],
            "nssf_pension_employee_khr": nssf_data["pension_employee_khr"],
            "nssf_pension_employer_khr": nssf_data["pension_employer_khr"],
            "nssf_health_employer_khr": nssf_data["health_employer_khr"],
            "nssf_accident_employer_khr": nssf_data["accident_employer_khr"],
            "taxable_salary_khr": taxable_salary_khr,
            "tax_relief_dependents_khr": tax_data["dependent_relief_khr"],
            "tax_base_salary_khr": tax_data["tax_base_salary_khr"],
            "tax_on_salary_khr": tax_data["tax_on_salary_khr"],
            "total_deductions_khr": total_deductions_khr,
            "net_salary_khr": net_salary_khr,
            "net_salary_usd": net_salary_usd,
            "calculation_snapshot": snapshot,
        }
