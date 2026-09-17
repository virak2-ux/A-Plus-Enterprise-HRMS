"""
Payslip Generator Service for Cambodia Enterprise HRMS.
Renders bilingual (Khmer/English) printable payslips with Cambodia GDT Tax on Salary,
NSSF statutory contributions, dual-currency breakdowns, and professional print CSS.
"""

from decimal import Decimal
from typing import Optional
from app.models.payroll import PayrollItem, PayrollRun, PayrollPeriod
from app.models.employee import Employee
from app.models.company import Company


def format_khr(val: Optional[Decimal | float | int]) -> str:
    if val is None:
        return "0 ៛"
    n = int(round(float(val)))
    return f"{n:,} ៛"


def format_usd(val: Optional[Decimal | float | int]) -> str:
    if val is None:
        return "$0.00"
    return f"${float(val):,.2f}"


class PayslipGenerator:
    @staticmethod
    def generate_html(
        item: PayrollItem,
        employee: Employee,
        run: PayrollRun,
        period: PayrollPeriod,
        company: Optional[Company] = None,
    ) -> str:
        co_name_kh = company.name_kh if company else "ក្រុមហ៊ុន ខេមថេក សូលូសិន ខូអិលធីឌី"
        co_name_en = company.name_en if company else "CamTech Solutions Co., Ltd."
        co_tin = company.tax_id_number if company and company.tax_id_number else "K001-902384912"
        co_nssf = company.nssf_number if company and company.nssf_number else "NSSF-99201"
        co_address = company.address if company and company.address else "Phnom Penh, Cambodia"

        emp_name_kh = f"{employee.last_name_kh} {employee.first_name_kh}"
        emp_name_en = f"{employee.first_name_en} {employee.last_name_en}"
        dept_name = employee.department.name_en if employee.department else "General Department"
        pos_name = employee.position.title_en if employee.position else "Staff"
        rate = float(run.exchange_rate_usd_to_khr or 4100.0)

        # Snapshot or live fields
        gross_khr = float(item.gross_salary_khr)
        base_earned_khr = float(item.base_salary_earned_khr)
        ot_khr = float(item.total_overtime_pay_khr)
        allowances_khr = float(item.total_allowances_khr)
        bonuses_khr = float(item.total_bonuses_khr)
        seniority_khr = float(item.seniority_indemnity_khr)

        nssf_pension_emp = float(item.nssf_pension_employee_khr)
        nssf_pension_empr = float(item.nssf_pension_employer_khr)
        nssf_health_empr = float(item.nssf_health_employer_khr)
        nssf_accident_empr = float(item.nssf_accident_employer_khr)

        tos_tax_khr = float(item.tax_on_salary_khr)
        taxable_khr = float(item.taxable_salary_khr)
        dependent_relief_khr = float(item.tax_relief_dependents_khr)
        loan_khr = float(item.loan_deduction_khr)
        other_ded_khr = float(item.other_deductions_khr)
        total_ded_khr = float(item.total_deductions_khr)

        net_khr = float(item.net_salary_khr)
        net_usd = float(item.net_salary_usd)

        # Dependents info
        dep_str = f"{employee.spouse_dependent_count} spouse, {employee.minor_children_count} children"

        html_content = f"""<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - {employee.employee_code} - {emp_name_en}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: 'Inter', 'Kantumruy Pro', 'Battambang', sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }}
    .no-print-bar {{
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }}
    .btn-print {{
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }}
    .btn-print:hover {{
      background: #4338ca;
    }}
    .payslip-container {{
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }}
    .company-title-kh {{
      font-size: 18px;
      font-weight: 700;
      color: #1e1b4b;
      font-family: 'Kantumruy Pro', sans-serif;
    }}
    .company-title-en {{
      font-size: 15px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }}
    .company-meta {{
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.5;
    }}
    .payslip-badge {{
      text-align: right;
    }}
    .badge-title-kh {{
      font-size: 20px;
      font-weight: 700;
      color: #4338ca;
      font-family: 'Kantumruy Pro', sans-serif;
    }}
    .badge-title-en {{
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #64748b;
      text-transform: uppercase;
    }}
    .period-badge {{
      display: inline-block;
      margin-top: 8px;
      padding: 4px 10px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }}
    .employee-card {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      font-size: 12px;
      margin-bottom: 24px;
    }}
    .meta-row {{
      display: flex;
      justify-content: space-between;
    }}
    .meta-label {{
      color: #64748b;
    }}
    .meta-value {{
      font-weight: 600;
      color: #0f172a;
    }}
    .table-section {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }}
    .panel {{
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }}
    .panel-header {{
      padding: 10px 14px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .panel-header-earn {{
      background: #f0fdf4;
      color: #166534;
      border-bottom: 1px solid #bbf7d0;
    }}
    .panel-header-ded {{
      background: #fef2f2;
      color: #991b1b;
      border-bottom: 1px solid #fecaca;
    }}
    .item-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }}
    .item-table td {{
      padding: 7px 14px;
      border-bottom: 1px solid #f1f5f9;
    }}
    .item-table tr:last-child td {{
      border-bottom: none;
    }}
    .item-table .amount {{
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 600;
      color: #1e293b;
    }}
    .panel-subtotal {{
      background: #f8fafc;
      font-weight: 700;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }}
    .net-payout-box {{
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(49, 46, 129, 0.15);
    }}
    .net-label-kh {{
      font-size: 15px;
      font-weight: 700;
      font-family: 'Kantumruy Pro', sans-serif;
    }}
    .net-label-en {{
      font-size: 11px;
      color: #c7d2fe;
      letter-spacing: 0.5px;
    }}
    .net-values {{
      text-align: right;
    }}
    .net-khr {{
      font-size: 22px;
      font-weight: 800;
      color: #38bdf8;
      font-family: 'Courier New', monospace;
    }}
    .net-usd {{
      font-size: 13px;
      color: #a5b4fc;
      margin-top: 2px;
    }}
    .employer-memo {{
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 11px;
      color: #475569;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
    }}
    .signature-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin-top: 36px;
      text-align: center;
      font-size: 11px;
      color: #475569;
    }}
    .signature-line {{
      height: 48px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 6px;
    }}
    .footer-note {{
      margin-top: 24px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }}

    @media print {{
      body {{
        background: #ffffff;
        padding: 0;
      }}
      .no-print-bar {{
        display: none !important;
      }}
      .payslip-container {{
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }}
      @page {{
        size: A4 portrait;
        margin: 15mm;
      }}
    }}
  </style>
</head>
<body>

  <div class="no-print-bar">
    <div>
      <strong>ប័ណ្ណបើកប្រាក់បៀវត្សរ៍ / Official Payslip</strong> &bull; {employee.employee_code} ({emp_name_en})
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ បោះពុម្ព / Print Payslip (PDF)
    </button>
  </div>

  <div class="payslip-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="company-title-kh">{co_name_kh}</div>
        <div class="company-title-en">{co_name_en}</div>
        <div class="company-meta">
          អាសយដ្ឋាន / Address: {co_address}<br>
          លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN): <strong>{co_tin}</strong> &bull; លេខបញ្ជី ប.ស.ស. (NSSF): <strong>{co_nssf}</strong>
        </div>
      </div>
      <div class="payslip-badge">
        <div class="badge-title-kh">ប័ណ្ណបើកប្រាក់បៀវត្សរ៍</div>
        <div class="badge-title-en">PAYSLIP</div>
        <div class="period-badge">
          {period.start_date.strftime('%d/%m/%Y')} – {period.end_date.strftime('%d/%m/%Y')}
        </div>
      </div>
    </div>

    <!-- Employee Information Grid -->
    <div class="employee-card">
      <div class="meta-row">
        <span class="meta-label">អត្តលេខបុគ្គលិក / Employee ID:</span>
        <span class="meta-value">{employee.employee_code}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">នាយកដ្ឋាន / Department:</span>
        <span class="meta-value">{dept_name}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">ឈ្មោះខ្មែរ / Khmer Name:</span>
        <span class="meta-value">{emp_name_kh}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">មុខតំណែង / Position:</span>
        <span class="meta-value">{pos_name}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">ឈ្មោះឡាតាំង / English Name:</span>
        <span class="meta-value">{emp_name_en}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">កាលបរិច្ឆេទចូល / Join Date:</span>
        <span class="meta-value">{employee.join_date.strftime('%d/%m/%Y')}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">គណនីធនាគារ / Bank Account:</span>
        <span class="meta-value">{employee.bank_name or 'ABA Bank'}: {employee.bank_account_number or '001 234 567'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">អត្រាប្តូរប្រាក់ / NBC Rate:</span>
        <span class="meta-value">1 USD = {int(rate):,} KHR</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">ស្ថានភាពពន្ធ / Tax Status:</span>
        <span class="meta-value">Resident ({dep_str})</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">កិច្ចសន្យា / Contract Base:</span>
        <span class="meta-value">{format_usd(item.base_salary_contract) if item.currency_contract == 'USD' else format_khr(item.base_salary_contract)}</span>
      </div>
    </div>

    <!-- Earnings & Deductions Tables -->
    <div class="table-section">
      <!-- Earnings -->
      <div class="panel">
        <div class="panel-header panel-header-earn">
          <span>ការទូទាត់ប្រាក់បៀវត្សរ៍ / EARNINGS</span>
          <span>ចំនួន (KHR)</span>
        </div>
        <table class="item-table">
          <tbody>
            <tr>
              <td>ប្រាក់ខែគោលទទួលបាន (Earned Base)</td>
              <td class="amount">{format_khr(base_earned_khr)}</td>
            </tr>
            <tr>
              <td>ប្រាក់បន្ថែមម៉ោងធ្វើការ (Overtime Pay)</td>
              <td class="amount">{format_khr(ot_khr)}</td>
            </tr>
            <tr>
              <td>ប្រាក់ឧបត្ថម្ភផ្សេងៗ (Allowances)</td>
              <td class="amount">{format_khr(allowances_khr)}</td>
            </tr>
            <tr>
              <td>ប្រាក់រង្វាន់លើកទឹកចិត្ត (Bonuses)</td>
              <td class="amount">{format_khr(bonuses_khr)}</td>
            </tr>
            <tr>
              <td>ប្រាក់បំណាច់អតីតភាពការងារ (Seniority)</td>
              <td class="amount">{format_khr(seniority_khr)}</td>
            </tr>
            <tr class="panel-subtotal">
              <td style="color: #166534;">ប្រាក់បៀវត្សរ៍សរុប (GROSS SALARY)</td>
              <td class="amount" style="color: #166534;">{format_khr(gross_khr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions -->
      <div class="panel">
        <div class="panel-header panel-header-ded">
          <span>ការកាត់កង / DEDUCTIONS</span>
          <span>ចំនួន (KHR)</span>
        </div>
        <table class="item-table">
          <tbody>
            <tr>
              <td>ប.ស.ស. របបសោធនបុគ្គលិក ២% (NSSF 2%)</td>
              <td class="amount" style="color: #b91c1c;">-{format_khr(nssf_pension_emp)}</td>
            </tr>
            <tr>
              <td>ពន្ធលើប្រាក់បៀវត្សរ៍ (GDT Tax on Salary)</td>
              <td class="amount" style="color: #b91c1c;">-{format_khr(tos_tax_khr)}</td>
            </tr>
            <tr>
              <td>ការកាត់កងប្រាក់កម្ចី (Loan Repayments)</td>
              <td class="amount" style="color: #b91c1c;">-{format_khr(loan_khr)}</td>
            </tr>
            <tr>
              <td>ការកាត់កងផ្សេងៗ (Other Deductions)</td>
              <td class="amount" style="color: #b91c1c;">-{format_khr(other_ded_khr)}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-size: 10px;">(អនុគ្រោះបន្ទុកគ្រួសារ: {format_khr(dependent_relief_khr)})</td>
              <td class="amount" style="color: #64748b; font-size: 10px;">អនុគ្រោះពន្ធ</td>
            </tr>
            <tr class="panel-subtotal">
              <td style="color: #991b1b;">ការកាត់កងសរុប (TOTAL DEDUCTIONS)</td>
              <td class="amount" style="color: #991b1b;">-{format_khr(total_ded_khr)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Net Payout Box -->
    <div class="net-payout-box">
      <div>
        <div class="net-label-kh">ប្រាក់បៀវត្សរ៍សុទ្ធត្រូវបើកផ្តល់</div>
        <div class="net-label-en">NET TAKE-HOME SALARY PAYABLE</div>
      </div>
      <div class="net-values">
        <div class="net-khr">{format_khr(net_khr)}</div>
        <div class="net-usd">Equivalent: <strong>{format_usd(net_usd)}</strong> USD</div>
      </div>
    </div>

    <!-- Statutory Employer Contributions (Memo) -->
    <div class="employer-memo">
      <div><strong>ការបង់វិភាគទាន ប.ស.ស. និយោជក (Employer NSSF Contributions):</strong></div>
      <div>
        សោធន (Pension 2%): <strong>{format_khr(nssf_pension_empr)}</strong> &bull;
        ថែទាំសុខភាព (Health 2.6%): <strong>{format_khr(nssf_health_empr)}</strong> &bull;
        ហានិភ័យការងារ (Accident 0.8%): <strong>{format_khr(nssf_accident_empr)}</strong>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signature-grid">
      <div>
        <div class="signature-line"></div>
        <strong>រៀបចំដោយ / Prepared By</strong><br>
        <span style="font-size: 10px; color: #94a3b8;">ផ្នែកប្រាក់បៀវត្សរ៍ (Payroll Dept)</span>
      </div>
      <div>
        <div class="signature-line"></div>
        <strong>ត្រួតពិនិត្យ និងអនុម័ត / Approved By</strong><br>
        <span style="font-size: 10px; color: #94a3b8;">នាយកហិរញ្ញវត្ថុ (Finance Director)</span>
      </div>
      <div>
        <div class="signature-line"></div>
        <strong>ហត្ថលេខាបុគ្គលិកទទួល / Employee</strong><br>
        <span style="font-size: 10px; color: #94a3b8;">កាលបរិច្ឆេទ / Date: ____/____/2026</span>
      </div>
    </div>

    <div class="footer-note">
      This document is generated by Cambodia Enterprise HRMS in accordance with the Labor Law of the Kingdom of Cambodia & GDT Regulations.
      Confidential document &bull; System Run ID: {run.id if run else 'DRAFT'} &bull; Timestamp: {run.calculated_at.strftime('%Y-%m-%d %H:%M:%S UTC') if (run and run.calculated_at) else '2026-03-31 00:00:00 UTC'}
    </div>
  </div>

</body>
</html>"""
        return html_content
