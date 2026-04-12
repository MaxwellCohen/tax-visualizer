import { getTaxYearConfig } from "~/lib/taxData";
import type { FilingStatus } from "~/lib/taxData";

function calculatePayrollTax(wages: number, taxYear: number, filingStatus: FilingStatus) {
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

function calculateSelfEmploymentTax(
  selfEmploymentIncome: number,
  taxYear: number,
  filingStatus: FilingStatus,
) {
  const config = getTaxYearConfig(taxYear);
  if (!config || selfEmploymentIncome <= 0) {
    return { selfEmploymentTax: 0, seSocialSecurityTax: 0, seMedicareTax: 0, additionalMedicareTax: 0, netEarnings: 0 };
  }

  const payroll = config.payroll;
  const netEarnings = selfEmploymentIncome * 0.9235;

  const seSocialSecurityTax = Math.min(netEarnings, payroll.socialSecurityWageBase) * (payroll.socialSecurityRate * 2);
  const seMedicareTax = netEarnings * (payroll.medicareRate * 2);
  
  const additionalThreshold = payroll.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax = netEarnings > additionalThreshold
    ? (netEarnings - additionalThreshold) * (payroll.additionalMedicareRate * 2)
    : 0;

  const selfEmploymentTax = seSocialSecurityTax + seMedicareTax + additionalMedicareTax;

  return { selfEmploymentTax, seSocialSecurityTax, seMedicareTax, additionalMedicareTax, netEarnings };
}
