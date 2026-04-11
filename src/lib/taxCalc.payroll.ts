import { getTaxYearConfig } from "~/lib/taxData";
import type { FilingStatus } from "~/lib/taxData";

export function calculatePayrollTax(wages: number, taxYear: number, filingStatus: FilingStatus) {
  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return { socialSecurityTax: 0, medicareTax: 0, payrollTax: 0 };
  }

  const payroll = config.payroll;
  const socialSecurityTax = Math.min(wages, payroll.socialSecurityWageBase) * payroll.socialSecurityRate;
  const additionalThreshold = payroll.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax = Math.max(0, wages - additionalThreshold) * payroll.additionalMedicareRate;
  const medicareTax = wages * payroll.medicareRate + additionalMedicareTax;
  const payrollTax = socialSecurityTax + medicareTax;

  return { socialSecurityTax, medicareTax, payrollTax };
}
