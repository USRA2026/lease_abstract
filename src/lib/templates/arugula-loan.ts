import type { SeedAbstract } from "./types";

/**
 * Transcribed from the "Arugula Property LLC Loan" exported abstract
 * (loan agreement abstraction, LDOTSA = Loan Deed of Trust, Security
 * Agreement, and other documents).
 */
export const arugulaLoan: SeedAbstract = {
  name: "Arugula Property LLC Loan",
  kind: "LOAN",
  assetName: "Arugula Property",
  documents: [
    {
      acronym: "LDOTSA",
      title: "Loan Deed of Trust, Security Agreement and Assignment of Rents",
      fileName: "Arugula Property LLC - Loan Deed of Trust, Security Agreement and Assignment of Rents.pdf",
    },
  ],
  sections: [
    {
      name: "General",
      fields: [
        { key: "propertyLocation", label: "Property Location", fieldType: "TEXT", value: "City of Camden, Calhoun County, Arkansas", citation: { acronym: "LDOTSA", sectionRef: "§ GRANTING CLAUSE FIRST" } },
        { key: "primaryLender", label: "Primary Lender", fieldType: "TEXT", value: "Wilmington Trust, National Association, as Trustee", citation: { acronym: "LDOTSA", page: "p. 6" } },
        { key: "lenderAllocations", label: "Lender Allocations", fieldType: "TEXT", value: "N/A" },
        { key: "borrower", label: "Borrower", fieldType: "TEXT", value: "Arugula Property LLC", citation: { acronym: "LDOTSA", sectionRef: "§ 1" } },
      ],
    },
    {
      name: "Interest Rate",
      fields: [
        { key: "rateType", label: "Rate Type", fieldType: "TEXT", value: "Fixed", citation: { acronym: "LDOTSA", sectionRef: "§ A" } },
        { key: "spreadOverIndex", label: "Spread over Index (%)", fieldType: "PERCENT", value: "N/A" },
        { key: "floatingIndex", label: "Floating Index", fieldType: "TEXT", value: "N/A" },
        { key: "indexFloor", label: "Index Floor %", fieldType: "PERCENT", value: "N/A" },
        { key: "interestOnlyPeriod", label: "Interest Only Period (months)", fieldType: "NUMBER", value: "N/A" },
        { key: "fixedInterestRate", label: "Fixed Interest Rate %", fieldType: "PERCENT", value: "6.16%", citation: { acronym: "LDOTSA", sectionRef: "§ A" } },
        { key: "amortizationYears", label: "Amortization (Years)", fieldType: "NUMBER", value: "N/A" },
        { key: "loanPaymentDate", label: "Loan Payment Date", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Amount",
      fields: [
        { key: "initialLoanAmount", label: "Initial Loan Amount", fieldType: "CURRENCY", value: "$447,000,000", citation: { acronym: "LDOTSA", page: "p. 20" } },
        { key: "totalLoanAmount", label: "Total Loan Amount", fieldType: "CURRENCY", value: "$447,000,000", citation: { acronym: "LDOTSA", page: "p. 20" } },
        { key: "requiredEquity", label: "Required Equity", fieldType: "TEXT", value: "N/A" },
        { key: "earnoutAmount", label: "Earnout Amount", fieldType: "TEXT", value: "N/A" },
        { key: "reservesOrEscrow", label: "Reserves or Escrow", fieldType: "LONG_TEXT", value: "Separate borrower-funded accounts held by Wilmington Trust as Escrow Agent to collect rents and other deposits and to pay debt service and property costs; failure to maintain required balances is an Escrow Shortfall.", citation: { acronym: "LDOTSA", sectionRef: "§§ GRANTING CLAUSE FOURTH, 1, 2.13, 2.18(b)(iv), 5.1(e)" } },
        { key: "permittedInvestments", label: "Permitted Investments", fieldType: "LONG_TEXT", value: "U.S. Treasuries (≤90 days), top-tier commercial paper (≤270 days), large-bank CDs (≤5 days), highly-rated U.S. dollar bank deposit accounts (≤360 days) and eligible proprietary money-market–type funds; interest for borrower, no lender liability.", citation: { acronym: "LDOTSA", sectionRef: "§ 4.3" } },
      ],
    },
    {
      name: "Dates",
      fields: [
        { key: "closingDate", label: "Closing Date", fieldType: "DATE", value: "December 18, 2025", citation: { acronym: "LDOTSA", sectionRef: "§ A; p. 1" } },
        { key: "initialMaturity", label: "Initial Maturity", fieldType: "DATE", value: "December 25, 2047", citation: { acronym: "LDOTSA", sectionRef: "§ Addendum A(2)" } },
        { key: "fullyExtendedMaturity", label: "Fully Extended Maturity", fieldType: "DATE", value: "December 25, 2047", citation: { acronym: "LDOTSA", sectionRef: "§ Addendum A(2)" } },
        { key: "completionDate", label: "Completion Date", fieldType: "DATE", value: "N/A" },
      ],
    },
    {
      name: "Extension",
      fields: [
        { key: "extensionOption", label: "Extension Option", fieldType: "TEXT", value: "N/A" },
        { key: "extensionNotification", label: "Extension Notification", fieldType: "TEXT", value: "N/A" },
        { key: "extensionRequirements", label: "Extension Requirements", fieldType: "TEXT", value: "N/A" },
        { key: "extensionFee", label: "Extension Fee", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Guaranty",
      fields: [
        { key: "guarantor", label: "Guarantor", fieldType: "TEXT", value: "Realty Holdings of America, LLC", citation: { acronym: "LDOTSA", sectionRef: "§ 1" } },
        { key: "guarantorNetWorth", label: "Guarantor Net Worth", fieldType: "TEXT", value: "N/A" },
        { key: "guarantorLiquidity", label: "Guarantor Liquidity", fieldType: "TEXT", value: "N/A" },
        { key: "recourseCarveouts", label: "Recourse Carveouts", fieldType: "LONG_TEXT", value: "Personal liability survives for obligations under the Indemnity & Guaranty Agreement and the Hazardous Material Indemnity Agreement (e.g., environmental liabilities and other carve-out events).", citation: { acronym: "LDOTSA", sectionRef: "§ 6.10" } },
        { key: "environmentalIndemnity", label: "Environmental Indemnity", fieldType: "LONG_TEXT", value: "Borrower must fully indemnify the lender for all losses and expenses related to environmental law violations and hazardous materials at the property, including investigation and clean-up costs.", citation: { acronym: "LDOTSA", sectionRef: "§§ 1, 2.22" } },
      ],
    },
    {
      name: "Reporting",
      fields: [
        { key: "ltv", label: "LTV", fieldType: "TEXT", value: "≤100% LTV, tested upon each issuance of new indebtedness", citation: { acronym: "LDOTSA", page: "p. 20" } },
        { key: "dscr", label: "DSCR", fieldType: "TEXT", value: "N/A" },
        { key: "debtYield", label: "Debt Yield", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Interest Rate Protection",
      fields: [
        { key: "cappedAmount", label: "Capped Amount", fieldType: "TEXT", value: "N/A" },
        { key: "rateCap", label: "Rate Cap %", fieldType: "PERCENT", value: "N/A" },
        { key: "interestRateCapCounterparty", label: "Interest Rate Cap Counterparty", fieldType: "TEXT", value: "N/A" },
        { key: "interestRateCapEffectiveDate", label: "Interest Rate Cap Effective Date", fieldType: "DATE", value: "N/A" },
        { key: "interestRateCapTerminationDate", label: "Interest Rate Cap Termination Date", fieldType: "DATE", value: "N/A" },
        { key: "swappedAmount", label: "Swapped Amount", fieldType: "TEXT", value: "N/A" },
        { key: "swapRate", label: "Swap Rate %", fieldType: "PERCENT", value: "N/A" },
        { key: "swapCounterparty", label: "Swap Counterparty", fieldType: "TEXT", value: "N/A" },
        { key: "swapEffectiveDate", label: "Swap Effective Date", fieldType: "DATE", value: "N/A" },
        { key: "swapTerminationDate", label: "Swap Termination Date", fieldType: "DATE", value: "N/A" },
      ],
    },
    {
      name: "Definitions",
      fields: [
        { key: "debtServiceDefinition", label: "Debt Service Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "debtYieldDefinition", label: "Debt Yield Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "dscrDefinition", label: "DSCR Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "operatingExpensesDefinition", label: "Operating Expenses Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "noiDefinition", label: "Net Operating Income (NOI) Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "netWorthDefinition", label: "Net Worth Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "liquidAssetsDefinition", label: "Liquid Assets Definition", fieldType: "LONG_TEXT", value: "N/A" },
        { key: "stepdownDate", label: "Stepdown Date", fieldType: "DATE", value: "N/A" },
      ],
    },
    {
      name: "Prepayment",
      fields: [
        { key: "prepayment", label: "Prepayment", fieldType: "LONG_TEXT", value: "May prepay in whole at any time with Make-Whole premium after 30–60 days’ notice; partial paydowns only under Section 8 transfer-related Paydown Option.", citation: { acronym: "LDOTSA", sectionRef: "§§ 2.12(c),(d), 8.1, 8.2" } },
        { key: "prepaymentPenalty", label: "Prepayment Penalty", fieldType: "LONG_TEXT", value: "Premium equal to the Make-Whole Amount (greater of 1% of principal or yield-maintenance calculation; waived only for total casualty/condemnation).", citation: { acronym: "LDOTSA", sectionRef: "§§ 1, 2.12(b), 5.2(a)" } },
        { key: "prepaymentMinimum", label: "Prepayment Minimum", fieldType: "LONG_TEXT", value: "Must prepay the full outstanding principal balance (no partial prepayments allowed under the general voluntary prepayment right).", citation: { acronym: "LDOTSA", sectionRef: "§ 2.12(b)" } },
      ],
    },
    {
      name: "Insurance",
      fields: [
        { key: "insuranceRequirements", label: "Insurance Requirements and Renewals", fieldType: "LONG_TEXT", value: "Continuous All-Risk property (full replacement cost), liability (≥US$2M CSL, ≥US$1M property damage), and builder’s risk coverages with specified deductibles; carriers A- or better; Beneficiary named loss payee/additional insured; 30-day cancellation notice; renewal certificates due ≥10 days before expiration; Tenant may self-insure if ≥US$100M net worth & investment-grade; losses >US$50K payable to Beneficiary; proceeds held/applied per §§4.1-4.3.", citation: { acronym: "LDOTSA", sectionRef: "§§ 2.15, 4.3" } },
      ],
    },
    {
      name: "Transfer / Assumption of Debt",
      fields: [
        { key: "transferability", label: "Transferability", fieldType: "LONG_TEXT", value: "Transfers of the property or controlling equity are prohibited unless detailed conditions (assumption, SPE status, opinions, no default, KYC, and payment of a $50,000/0.50% Transfer Fee) are met; limited family, estate-planning, statutory-trust and ≤25% non-controlling transfers are exempt or fee-free; sale to the tenant always needs Beneficiary consent; violations constitute default/acceleration.", citation: { acronym: "LDOTSA", sectionRef: "§§ 2.2, 2.3(g)(i)-(v),(vii), 2.3(h)(i)-(v), 2.3(i); p. 22" } },
      ],
    },
    {
      name: "Late Charge",
      fields: [
        { key: "lateChargePercent", label: "Late Charge %", fieldType: "PERCENT", value: "N/A" },
        { key: "lateChargeGracePeriod", label: "Late Charge Grace Period", fieldType: "TEXT", value: "N/A" },
        { key: "defaultRate", label: "Default Rate %", fieldType: "PERCENT", value: "Lesser of 11.16% per annum and the highest rate legally chargeable", citation: { acronym: "LDOTSA", sectionRef: "§ 1" } },
      ],
    },
    {
      name: "Cash Seep and Trigger Events",
      fields: [
        { key: "cashSweepTriggers", label: "Cash Sweep Triggers", fieldType: "TEXT", value: "N/A" },
        { key: "triggerEvent", label: "Trigger Event", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Lender / Servicer Approvals",
      fields: [
        { key: "leaseAndSublease", label: "Lease and Sublease", fieldType: "LONG_TEXT", value: "Beneficiary’s prior written consent is required for any new lease, amendment, termination, surrender, subordination, assignment of rents, or rent prepayment (>1 month) under the Lease, Ground Lease or other leases, except for subleases expressly permitted by the Lease/Ground Lease.", citation: { acronym: "LDOTSA", sectionRef: "§§ 1, 2.3(f), 2.18(b)(ii),(v), 2.18(b)(iii)(A)" } },
        { key: "alterations", label: "Alterations", fieldType: "LONG_TEXT", value: "Material alterations require compliance with Lease/Construction Agency Agreement and must not impair value; costs, permits and lien discharges are Grantor/Tenant responsibility; routine maintenance allowed without consent.", citation: { acronym: "LDOTSA", sectionRef: "§ 2.14(a),(c)" } },
        { key: "easement", label: "Easement", fieldType: "LONG_TEXT", value: "Prior written consent of the Beneficiary is required for any new, modified, or surrendered easement (other than minor easements that do not materially affect value or use).", citation: { acronym: "LDOTSA", sectionRef: "§§ 2.17(d), 2.18(b)(iii)(A)" } },
        { key: "majorContract", label: "Major Contract", fieldType: "LONG_TEXT", value: "N/A" },
      ],
    },
    {
      name: "Events of Default",
      fields: [
        { key: "tenantDefaultEvents", label: "Tenant Default Events", fieldType: "LONG_TEXT", value: "Tenant defaults include: (1) uncured lease or ground-lease defaults lasting 6 consecutive months (or 12 months in total), (2) tenant/guarantor bankruptcy or insolvency events that lead to lease rejection, (3) material misstatements by the tenant or its guarantors, and (4) the lease or related guaranties becoming invalid, unenforceable or contested by the tenant.", citation: { acronym: "LDOTSA", sectionRef: "§ 5.1(d),(g),(j),(k)" } },
      ],
    },
    {
      name: "Fees",
      fields: [
        { key: "originationFee", label: "Origination Fee", fieldType: "TEXT", value: "N/A" },
        { key: "exitFee", label: "Exit Fee", fieldType: "TEXT", value: "N/A" },
        { key: "developersFee", label: "Developer's Fee", fieldType: "TEXT", value: "N/A" },
        { key: "unusedFee", label: "Unused Fee", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Notice",
      fields: [
        { key: "lenderNotices", label: "Lender Notices", fieldType: "LONG_TEXT", value: "Wilmington Trust, National Association, as Trustee, One Light Street, 15th Floor, Baltimore, MD 21202, Attn: Corporate Trust Administration (copy to Mayer Brown LLP, 71 South Wacker Dr., Chicago, IL 60606, Attn: Daniel J. Favero)", citation: { acronym: "LDOTSA", sectionRef: "§ 6.3" } },
        { key: "borrowerNoticeEvents", label: "Events requiring Borrower to give notice (even though permitted)", fieldType: "LONG_TEXT", value: "N/A" },
      ],
    },
    {
      name: "Missing Documents",
      fields: [
        { key: "missingDocuments", label: "Missing Documents", fieldType: "LONG_TEXT", value: "Construction Agency Agreement\nPromissory Note\nDeed of Trust\nGuaranty Agreement" },
      ],
    },
  ],
  reportingRequirements: [
    { item: "Balance sheet", frequency: "Annual", dueBy: "Within 120 days after fiscal year end" },
    { item: "Statement of operating income, retained earnings and cash flows", frequency: "Annual", dueBy: "Within 120 days after fiscal year end" },
    { item: "Written statement regarding existence of any Default or Event of Default", frequency: "Annual", dueBy: "Within 120 days after fiscal year end" },
    { item: "Notice of Default or Event of Default", frequency: "As occurs", dueBy: "Immediately upon officer/member acquiring actual knowledge" },
    { item: "Notice of intent to issue new indebtedness", frequency: "As needed", dueBy: "Not less than 45 days advance written notice" },
  ],
};
