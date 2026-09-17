from decimal import Decimal
from app.services.payroll_engine import CambodiaPayrollCalculator


def test_nssf_calculation_within_ceiling():
    gross_khr = Decimal("1000000")  # 1,000,000 KHR (between 400k and 1.2M)
    res = CambodiaPayrollCalculator.calculate_nssf(gross_khr)

    assert res["contributory_wage_khr"] == Decimal("1000000")
    # Employee pension = 2% of 1,000,000 = 20,000 KHR
    assert res["pension_employee_khr"] == Decimal("20000")
    # Employer pension = 2% of 1,000,000 = 20,000 KHR
    assert res["pension_employer_khr"] == Decimal("20000")
    # Employer health = 2.6% of 1,000,000 = 26,000 KHR
    assert res["health_employer_khr"] == Decimal("26000")
    # Employer accident = 0.8% of 1,000,000 = 8,000 KHR
    assert res["accident_employer_khr"] == Decimal("8000")


def test_nssf_calculation_capped_at_ceiling():
    # 5,000,000 KHR (exceeds 1.2M ceiling)
    gross_khr = Decimal("5000000")
    res = CambodiaPayrollCalculator.calculate_nssf(gross_khr)

    assert res["contributory_wage_khr"] == Decimal("1200000")
    assert res["pension_employee_khr"] == Decimal("24000")  # 2% of 1,200,000
    assert res["pension_employer_khr"] == Decimal("24000")
    assert res["health_employer_khr"] == Decimal("31200")  # 2.6% of 1,200,000
    assert res["accident_employer_khr"] == Decimal("9600")  # 0.8% of 1,200,000


def test_cambodia_tax_on_salary_zero_bracket():
    # Below 1,500,000 KHR threshold -> 0% Tax
    taxable = Decimal("1400000")
    res = CambodiaPayrollCalculator.calculate_tax_on_salary(taxable, is_resident=True)
    assert res["tax_on_salary_khr"] == Decimal("0")


def test_cambodia_tax_on_salary_with_dependents():
    # 2,200,000 KHR taxable salary
    # With 2 dependents (spouse + 1 child) = 2 * 150,000 = 300,000 KHR deduction
    # Tax base becomes 2,200,000 - 300,000 = 1,900,000 KHR
    # Under 2,000,000 KHR:
    # 0 - 1,500,000 = 0%
    # 1,500,001 - 1,900,000 (400,000 KHR) * 5% = 20,000 KHR
    taxable = Decimal("2200000")
    res = CambodiaPayrollCalculator.calculate_tax_on_salary(
        taxable_salary_khr=taxable,
        spouse_dependent_count=1,
        minor_children_count=1,
        is_resident=True,
    )
    assert res["dependent_relief_khr"] == Decimal("300000")
    assert res["tax_base_salary_khr"] == Decimal("1900000")
    assert res["tax_on_salary_khr"] == Decimal("20000")


def test_non_resident_flat_tax():
    taxable = Decimal("2000000")
    res = CambodiaPayrollCalculator.calculate_tax_on_salary(
        taxable_salary_khr=taxable,
        is_resident=False,
    )
    # Flat 20% on 2,000,000 = 400,000 KHR
    assert res["tax_on_salary_khr"] == Decimal("400000")


def test_full_employee_payroll_calculation():
    # Employee with $1,000 USD base salary
    # Rate: 4,100 KHR/USD -> 4,100,000 KHR
    # NSSF ceiling 1,200,000 -> Employee pension: 24,000 KHR
    # Taxable salary = 4,100,000 - 24,000 = 4,076,000 KHR
    # 1 spouse, 1 child -> 300,000 relief -> Tax base = 3,776,000 KHR
    res = CambodiaPayrollCalculator.compute_employee_payroll(
        base_salary_contract=Decimal("1000"),
        currency_contract="USD",
        exchange_rate_usd_to_khr=Decimal("4100"),
        spouse_dependent_count=1,
        minor_children_count=1,
        is_resident=True,
    )
    assert res["gross_salary_khr"] == Decimal("4100000")
    assert res["nssf_pension_employee_khr"] == Decimal("24000")
    assert res["net_salary_khr"] > Decimal("3500000")
    assert res["net_salary_usd"] > Decimal("800.00")
    assert res["calculation_snapshot"] is not None
