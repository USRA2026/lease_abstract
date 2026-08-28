import type { SeedAbstract } from "./types";

/**
 * Transcribed from the "Orlando Garden Property" exported abstract
 * (lease abstraction; BL = Lease Agreement, 1A = First Amendment).
 */
export const orlandoGardenLease: SeedAbstract = {
  name: "Orlando Garden Property Lease",
  kind: "LEASE",
  assetName: "Orlando Garden Property",
  documents: [
    { acronym: "BL", title: "Lease Agreement", fileName: "Orlando Garden Property LLC - Lease Agreement.pdf" },
    { acronym: "1A", title: "First Amendment to Lease", fileName: "Orlando Garden Property LLC - First Amendment to Lease.pdf" },
  ],
  sections: [
    {
      name: "General",
      fields: [
        { key: "tenantName", label: "Tenant Name", fieldType: "TEXT", value: "Darden Corporation", citation: { acronym: "BL", page: "p. 1" } },
        { key: "squareFeet", label: "Square Feet", fieldType: "TEXT", value: "Approximately 525,000 gross square feet (507,000 SF Office Building + 18,000 SF Data Center)", citation: { acronym: "BL", page: "p. 4" } },
        { key: "premisesDescription", label: "Premises Description", fieldType: "LONG_TEXT", value: "The Land, the Improvements and the Appurtenant Rights, including all Building Systems and Fixtures, located in Orlando, Orange County, Florida: a three-story Office Building (~507,000 SF), a single-story Data Center (~18,000 SF), and a four-story Parking Garage, together with all other improvements on the Land.", citation: { acronym: "BL", sectionRef: "§ 1" } },
        { key: "propertyAddress", label: "Property Address", fieldType: "TEXT", value: "1000 Darden Center Drive", citation: { acronym: "BL", page: "p. 1" } },
        { key: "propertyCityStateZip", label: "Property City, State, Zip", fieldType: "TEXT", value: "Orlando, FL 32837", citation: { acronym: "BL", page: "p. 1" } },
        { key: "guarantorName", label: "Guarantor", fieldType: "TEXT", value: "Darden Restaurants, Inc.", citation: { acronym: "BL", sectionRef: "§ Guarantor" } },
        { key: "permittedUse", label: "Permitted Use", fieldType: "LONG_TEXT", value: "General business or professional offices, including data center, test kitchens, fitness & wellness center, private cafeteria, company store, and parking.", citation: { acronym: "BL", sectionRef: "§ 4(a)" } },
        { key: "landlordEntity", label: "Landlord Entity", fieldType: "TEXT", value: "Orlando Garden Property LLC", citation: { acronym: "BL", page: "p. 1" } },
      ],
    },
    {
      name: "Dates",
      fields: [
        { key: "leaseAgreementDate", label: "Lease Agreement Date", fieldType: "TEXT", value: "Lease Agreement: 10/26/2015  |  First Amendment: 5/1/2026" },
        { key: "leaseCommencementDate", label: "Lease Commencement Date", fieldType: "DATE", value: "October 26, 2015", citation: { acronym: "BL", sectionRef: "§ 5(a); p. 4" } },
        { key: "rentCommencementDate", label: "Rent Commencement Date", fieldType: "DATE", value: "10/26/2015" },
        { key: "leaseExpirationDate", label: "Lease Expiration Date", fieldType: "DATE", value: "04/30/2046", citation: { acronym: "1A", sectionRef: "§ 3" } },
        { key: "term", label: "Term", fieldType: "TEXT", value: "20 years", citation: { acronym: "BL", sectionRef: "§ 5(a)" } },
      ],
    },
    {
      name: "Base Rent",
      fields: [
        { key: "leaseType", label: "Lease Type", fieldType: "TEXT", value: "NNN", citation: { acronym: "BL", sectionRef: "§ 8" } },
        { key: "rentDueDate", label: "Rent Due Date", fieldType: "TEXT", value: "1st day of each calendar month", citation: { acronym: "BL", sectionRef: "§ 6(b)" } },
        { key: "rentEscalation", label: "Rent Escalation", fieldType: "LONG_TEXT", value: "Starting from a base rent of $7,994,794 in Year 1, each subsequent year's rent is the lower of actual CPI-adjusted rent or a 2% compounded annual cap, with a catch-up mechanism tracking the cumulative CPI/cap difference; total cumulative rent can never exceed the amounts predetermined in Schedule X.", citation: { acronym: "BL", sectionRef: "§§ 6(a), CPI Escalated Rent(a), Escalated Rent(b)-(d)" } },
      ],
    },
    {
      name: "Late Fee",
      fields: [
        { key: "lateFeePercent", label: "Late Fee %", fieldType: "PERCENT", value: "3%", citation: { acronym: "BL", sectionRef: "§ 7(a)(ii)" } },
        { key: "lateFeeGracePeriod", label: "Late Fee Grace Period", fieldType: "TEXT", value: "5 Business Days", citation: { acronym: "BL", sectionRef: "§ 7(a)(ii)" } },
        { key: "interestRate", label: "Interest Rate", fieldType: "TEXT", value: "Prime Rate + 2% per annum", citation: { acronym: "BL", sectionRef: "§ 7(a)(iv)" } },
        { key: "interestGracePeriod", label: "Interest Grace Period", fieldType: "TEXT", value: "0 days", citation: { acronym: "BL", sectionRef: "§ 7(a)(iv)" } },
      ],
    },
    {
      name: "Security Deposit",
      fields: [
        { key: "securityDepositAmount", label: "Security Deposit / LOC Amount", fieldType: "TEXT", value: "N/A" },
        { key: "securityDepositRequirements", label: "Security Deposit / LOC Requirements", fieldType: "TEXT", value: "N/A" },
        { key: "guarantyPresent", label: "Guaranty", fieldType: "TEXT", value: "Yes", citation: { acronym: "1A", page: "p. 1" } },
      ],
    },
    {
      name: "Tenant Improvement",
      fields: [{ key: "tenantImprovement", label: "Tenant Improvement", fieldType: "TEXT", value: "N/A" }],
    },
    {
      name: "Alteration",
      fields: [
        { key: "alterationConsentThresholds", label: "Alteration Consent Thresholds", fieldType: "LONG_TEXT", value: "Structural or value-diminishing/size-reducing Alterations: Landlord consent required. Work costing > $1,000,000 (when Guarantor not Investment-Grade): security required.", citation: { acronym: "BL", sectionRef: "§ 13" } },
        { key: "decommissioning", label: "Decommissioning", fieldType: "LONG_TEXT", value: "Upon lease expiration, Tenant must remove all its property (excluding Building Systems and Fixtures), repair any damage from removal, and surrender the premises. Any property not removed is considered abandoned and becomes the Landlord's property.", citation: { acronym: "BL", sectionRef: "§§ 1(c), 26(a); p. 17" } },
      ],
    },
    {
      name: "Additional Rent",
      fields: [
        { key: "proRataShare", label: "Pro Rata Share", fieldType: "PERCENT", value: "N/A" },
        { key: "capPercent", label: "Cap %", fieldType: "PERCENT", value: "N/A" },
        { key: "grossUpPercent", label: "Gross Up %", fieldType: "PERCENT", value: "N/A" },
        { key: "baseYear", label: "Base Year", fieldType: "TEXT", value: "N/A" },
        { key: "operatingExpenses", label: "Operating Expenses", fieldType: "TEXT", value: "Tenant pays all operating expenses (absolute net)", citation: { acronym: "BL", sectionRef: "§ 8(c)" } },
        { key: "propertyManagement", label: "Property Management", fieldType: "TEXT", value: "N/A" },
        { key: "propertyManagementFee", label: "Property Management Fee", fieldType: "TEXT", value: "N/A" },
        { key: "taxes", label: "Taxes", fieldType: "TEXT", value: "Tenant pays all taxes and Impositions (except Excluded Taxes on Landlord)", citation: { acronym: "BL", sectionRef: "§ 9(a)" } },
        { key: "insuranceCostAllocation", label: "Insurance", fieldType: "TEXT", value: "Tenant pays 100% of insurance premiums and maintains all required coverages", citation: { acronym: "BL", sectionRef: "§ 16(c),(d)" } },
        { key: "utilities", label: "Utilities", fieldType: "TEXT", value: "Tenant pays all utilities", citation: { acronym: "BL", sectionRef: "§ 9(a)" } },
        { key: "reimbursementOfLLExpenses", label: "Reimbursement of LL expenses for Tenant Requests", fieldType: "LONG_TEXT", value: "Tenant must reimburse Landlord for all reasonable/actual costs and expenses incurred in carrying out Tenant-requested actions that are outside Landlord's standard obligations.", citation: { acronym: "BL", sectionRef: "§§ 4(d), 11(c), 14" } },
      ],
    },
    {
      name: "Tenant Options",
      fields: [
        { key: "renewalOption", label: "Renewal Option", fieldType: "LONG_TEXT", value: "Three options – 5 years, 10 years, 5 years; notice due 365 days before expiration; exercisable only if lease in effect and no default.", citation: { acronym: "1A", sectionRef: "§ 4" } },
        { key: "renewalRent", label: "Renewal Rent", fieldType: "LONG_TEXT", value: "Monthly Basic Rent carries over from the prior month and increases 1.75% each November 1 of the Extension Term.", citation: { acronym: "1A", sectionRef: "§§ 4, 5" } },
        { key: "rofoPurchase", label: "ROFO (Purchase)", fieldType: "LONG_TEXT", value: "Continuing ROFO to purchase: 15-business-day election, 60-day closing, applies to sales of ≥50% interest, with stated carve-outs and loss on default.", citation: { acronym: "BL", sectionRef: "§ 28(a)-(d)" } },
        { key: "rofoLease", label: "ROFO (Lease)", fieldType: "TEXT", value: "N/A" },
        { key: "rofrLease", label: "ROFR (Lease)", fieldType: "TEXT", value: "N/A" },
        { key: "earlyTermination", label: "Early Termination", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Repairs",
      fields: [
        { key: "tenantRepairs", label: "Tenant Repairs", fieldType: "LONG_TEXT", value: "Tenant is responsible for all repairs and maintenance of the property, including the Premises, Building Systems, Fixtures, signage, and the reclaimed water flushing system.", citation: { acronym: "BL", sectionRef: "§§ 8(c), 12(a), 29" } },
        { key: "landlordRepairs", label: "Landlord Repairs", fieldType: "TEXT", value: "N/A" },
        { key: "deferredMaintenanceFromLender", label: "Deferred Maintenance from Lender", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Insurance",
      fields: [
        {
          key: "tenantInsuranceRequirements",
          label: "Tenant Insurance Requirements",
          fieldType: "LONG_TEXT",
          value:
            "During the Lease Term, Tenant must maintain, at its expense: (i) property insurance covering all risks to the Improvements at 100% replacement cost, naming Landlord and Lender as additional insureds/loss payees; (ii) public liability insurance of at least $10,000,000 per location; (iii) workers' compensation and disability insurance as legally required; (iv) employers' liability insurance of $1,000,000 per accident/illness; (v) comprehensive boiler and machinery/equipment breakdown insurance; (vi) business income/extra expense insurance equal to 100% of Rent during Restoration; (vii) builder's \"all risk\" insurance during construction/alterations; (viii) flood insurance if the Premises is in a special flood hazard area; and (ix) other insurance as reasonably required by Landlord or Lender.",
        },
        { key: "landlordInsuranceRequirements", label: "Landlord Insurance Requirements", fieldType: "TEXT", value: "N/A" },
      ],
    },
    {
      name: "Contact Info",
      fields: [
        { key: "tenantContactInfo", label: "Tenant Contact Info", fieldType: "LONG_TEXT", value: "Darden Restaurants, Inc., Attn: Property Law Administration Dept., 1000 Darden Center Drive, Orlando, FL 32837 (Tel. 407-245-4000), with copies to General Counsel and to Lowndes, Drosdick, Doster, Kantor & Reed, P.A., 215 North Eola Drive, Orlando, FL 32801, Attn: Jon C. Yergler, Esq. (Tel. 407-843-4600)", citation: { acronym: "BL", sectionRef: "§ 24" } },
        { key: "landlordNoticeAddress", label: "Landlord Notice Address", fieldType: "LONG_TEXT", value: "Orlando Garden Property LLC, c/o U.S. Realty Advisors, LLC, 1345 Avenue of the Americas, New York, NY 10105, Attn: General Counsel, Email: legal@usrallc.com (copy to Smith, Gambrell & Russell, LLP, 1105 W Peachtree St NE, Suite 1000, Atlanta, GA 30309, Attn: Eugene D. Bryant, Esq.)", citation: { acronym: "1A", sectionRef: "§ 9" } },
        { key: "landlordRightOfEntry", label: "Landlord Right of Entry", fieldType: "LONG_TEXT", value: "Landlord (and lender/agents) may enter with 2 business days' written notice (no notice in emergencies) for inspections, compliance checks, showings, repairs or environmental assessments, while minimizing interference.", citation: { acronym: "BL", sectionRef: "§§ 10(c), 20(b),(c)" } },
        { key: "generalNoticeProvisions", label: "General Notice Provisions", fieldType: "LONG_TEXT", value: "Written notice via hand delivery, certified/registered mail (return receipt) or overnight courier; effective on delivery/refusal or one business day after courier acceptance; must be sent to the addresses listed in the lease or any replacement address given by notice.", citation: { acronym: "BL", sectionRef: "§ 24" } },
      ],
    },
    {
      name: "Other",
      fields: [
        { key: "casualty", label: "Casualty", fieldType: "LONG_TEXT", value: "Tenant must continue paying rent and restore the Premises at its own cost after a casualty, with no rent abatement. Tenant may only terminate if, in the last 3 years of the term, damage exceeds 25% of insurable value and is fully insured; otherwise, insurance proceeds go to Landlord. If not terminated, Tenant restores, and the Net Award is generally paid to Tenant unless an Event of Default occurs.", citation: { acronym: "BL", sectionRef: "§§ 8(b), 17, 19(b)" } },
        { key: "restorationObligations", label: "Restoration Obligations", fieldType: "LONG_TEXT", value: "Tenant must restore the Premises at its own cost to its pre-event condition following a casualty or condemnation and must surrender the Premises in good repair at the end of the lease.", citation: { acronym: "BL", sectionRef: "§§ 19, 26(a)" } },
        { key: "eminentDomain", label: "Eminent Domain, Condemnation, Appropriation", fieldType: "LONG_TEXT", value: "Landlord controls the proceeding and escrowed award; Tenant may pursue its own limited claim; no rent abatement and Tenant must restore after a partial taking; Lease terminates automatically if a substantial or total taking occurs, with separate award rights preserved.", citation: { acronym: "BL", sectionRef: "§§ 18, Condemnation, Condemnation Notice, 19(b)" } },
        {
          key: "eventOfDefault",
          label: "Event of Default",
          fieldType: "LONG_TEXT",
          value:
            'An "Event of Default" occurs under this Lease if: (i) Tenant fails to pay Basic Rent after a 10-day notice period for the first failure in a Lease Year; (ii) Tenant fails to pay other Monetary Obligations after a 10-day notice; (iii) Tenant fails to perform non-monetary terms, with a 30-day cure period (extendable to 180 days if diligently pursued); (iv) representations or warranties are materially incorrect; (v) Tenant or Guarantor admits inability to pay debts or faces bankruptcy/insolvency proceedings unresolved for specified periods; (vi) Tenant\'s interest is levied upon and not discharged within 90 days; (vii)-(viii) Tenant fails to maintain required insurance; or (ix) Guarantor defaults under its Guaranty.',
          citation: { acronym: "BL", sectionRef: "§ 22(a)" },
        },
        { key: "goDark", label: "Go Dark", fieldType: "TEXT", value: "N/A" },
        { key: "exclusiveUse", label: "Exclusive Use", fieldType: "LONG_TEXT", value: "Landlord is prohibited from conveying the premises to specified casual or fine-dining restaurant competitors (national or regional brands with ≥10 locations).", citation: { acronym: "BL", sectionRef: "§ 28(c)" } },
        { key: "financialReportingRequirements", label: "Financial Reporting Requirements", fieldType: "LONG_TEXT", value: "Audited annual financial statements due within 90 days after each fiscal year-end (with public-company consolidation exceptions).", citation: { acronym: "1A", sectionRef: "§ 10" } },
        { key: "estoppel", label: "Estoppel", fieldType: "LONG_TEXT", value: "Either party must provide a written estoppel certificate within 20 days of request, certifying lease status, rent paid, defaults, and other requested facts.", citation: { acronym: "BL", sectionRef: "§ 25" } },
        { key: "holdingOver", label: "Holding Over", fieldType: "LONG_TEXT", value: "125% of Basic Rent for the first 6 months; 150% of Basic Rent thereafter until surrender.", citation: { acronym: "BL", sectionRef: "§ 26(b)" } },
        { key: "signage", label: "Signage", fieldType: "TEXT", value: "Tenant may install, maintain and repair signage at its own expense.", citation: { acronym: "BL", sectionRef: "§ 29" } },
        { key: "parking", label: "Parking", fieldType: "TEXT", value: "On-site four-story Parking Garage; number of spaces and pricing not specified in excerpts.", citation: { acronym: "BL", sectionRef: "§ 4(a); p. 4" } },
        { key: "subordination", label: "Subordination", fieldType: "LONG_TEXT", value: "Tenant's leasehold is subordinate to future mortgages subject to receipt of an SNDA; Tenant will attorn to a successor lender/owner, and a lender may elect to give the lease priority or collect rent directly.", citation: { acronym: "BL", sectionRef: "§ 32(a)-(f)" } },
        { key: "permittedLeaseholdMortgages", label: "Permitted Leasehold Mortgages and Ground Leases", fieldType: "LONG_TEXT", value: "Leasehold mortgage permitted solely with prior written consent of Landlord and Landlord's lender; otherwise prohibited.", citation: { acronym: "BL", sectionRef: "§§ 11(b), Ex. C(5)" } },
        { key: "localIncentivesStructure", label: "Local Incentives Structure", fieldType: "LONG_TEXT", value: "All governmental economic incentives belong exclusively to the Tenant, and the Landlord is prohibited from taking any action that would reduce or limit the Tenant's benefit from them.", citation: { acronym: "BL", sectionRef: "§ 35(s)" } },
        { key: "subleaseAssignment", label: "Sublease and Assignment and Permitted Transfer", fieldType: "LONG_TEXT", value: "Tenant may assign or sublet the lease without landlord consent but remains primarily liable (along with the guarantor), and the transfer is subject to conditions including providing documentation, term limits, and tax-related restrictions.", citation: { acronym: "BL", sectionRef: "§ 21(a),(c)" } },
        { key: "easements", label: "Easements", fieldType: "LONG_TEXT", value: "All existing easements listed in Exhibit B remain in place, and no new or modified easement may bind the Premises without Tenant's written consent; Tenant may request easements if not detrimental, without recourse to Landlord, and Tenant pays related costs.", citation: { acronym: "BL", sectionRef: "§ 4(c),(d); p. 15" } },
        { key: "covenantAgainstLiens", label: "Covenant against Liens", fieldType: "LONG_TEXT", value: "Tenant covenants that it will not allow any liens on the Premises (other than agreed Permitted Encumbrances or Landlord-caused liens), will promptly discharge any lien that does arise, will post non-liability notices, and may only encumber its own personal property; it may contest liens only under the Lease's Permitted Contest procedure.", citation: { acronym: "BL", sectionRef: "§§ 11(a),(b), 13, 14(a), 15(a), Ex. C(4)" } },
        { key: "confidentiality", label: "Confidentiality", fieldType: "LONG_TEXT", value: "Landlord and tenant must keep all Lease Information and Proprietary Information confidential, may release it only to specified insiders or as required by law, and remain liable for any unauthorized disclosure; these obligations are perpetual.", citation: { acronym: "BL", sectionRef: "§ 35(t); pp. 14, 16" } },
      ],
    },
    {
      name: "Missing Documents",
      fields: [{ key: "missingDocuments", label: "Missing Documents", fieldType: "LONG_TEXT", value: "N/A" }],
    },
  ],
  rentSchedule: [
    { start: "2015-10-26", end: "2016-10-31", monthlyRent: "$666,232.83", percentIncrease: "N/A", sourceDocument: "Lease Agreement" },
    { start: "2016-11-01", end: "2017-10-31", monthlyRent: "$675,985.04", percentIncrease: "1.46%", sourceDocument: "Lease Agreement" },
    { start: "2017-11-01", end: "2018-10-31", monthlyRent: "$691,079.54", percentIncrease: "2.23%", sourceDocument: "Lease Agreement" },
    { start: "2018-11-01", end: "2019-10-31", monthlyRent: "$706,815.23", percentIncrease: "2.28%", sourceDocument: "Lease Agreement" },
    { start: "2019-11-01", end: "2020-10-31", monthlyRent: "$718,910.99", percentIncrease: "1.71%", sourceDocument: "Lease Agreement" },
    { start: "2020-11-01", end: "2021-10-31", monthlyRent: "$728,769.60", percentIncrease: "1.37%", sourceDocument: "Lease Agreement" },
    { start: "2021-11-01", end: "2022-10-31", monthlyRent: "$750,286.38", percentIncrease: "2.95%", sourceDocument: "Lease Agreement" },
    { start: "2022-11-01", end: "2023-10-31", monthlyRent: "$783,058.55", percentIncrease: "4.37%", sourceDocument: "Lease Agreement" },
    { start: "2023-11-01", end: "2024-10-31", monthlyRent: "$846,351.82", percentIncrease: "8.08%", sourceDocument: "Lease Agreement" },
    { start: "2024-11-01", end: "2025-10-31", monthlyRent: "$877,404.13", percentIncrease: "3.67%", sourceDocument: "Lease Agreement" },
    { start: "2025-11-01", end: "2026-04-30", monthlyRent: "N/A", percentIncrease: "2.00%", sourceDocument: "Lease Agreement" },
    { start: "2026-05-01", end: "2026-10-01", monthlyRent: "$796,174", sourceDocument: "First Amendment" },
    { start: "2026-11-01", end: "2027-10-01", monthlyRent: "$810,107", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2027-11-01", end: "2028-10-01", monthlyRent: "$824,283", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2028-11-01", end: "2029-10-01", monthlyRent: "$838,708", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2029-11-01", end: "2030-10-01", monthlyRent: "$853,386", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2030-11-01", end: "2031-10-01", monthlyRent: "$868,320", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2031-11-01", end: "2032-10-01", monthlyRent: "$883,516", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2032-11-01", end: "2033-10-01", monthlyRent: "$898,977", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2033-11-01", end: "2034-10-01", monthlyRent: "$914,709", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2034-11-01", end: "2035-10-01", monthlyRent: "$930,717", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2035-11-01", end: "2036-10-01", monthlyRent: "$947,004", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2036-11-01", end: "2037-10-01", monthlyRent: "$963,577", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2037-11-01", end: "2038-10-01", monthlyRent: "$980,439", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2038-11-01", end: "2039-10-01", monthlyRent: "$997,597", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2039-11-01", end: "2040-10-01", monthlyRent: "$1,015,055", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2040-11-01", end: "2041-10-01", monthlyRent: "$1,032,818", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2041-11-01", end: "2042-10-01", monthlyRent: "$1,050,893", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2042-11-01", end: "2043-10-01", monthlyRent: "$1,069,283", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2043-11-01", end: "2044-10-01", monthlyRent: "$1,087,996", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2044-11-01", end: "2045-10-01", monthlyRent: "$1,107,036", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
    { start: "2045-11-01", end: "2046-04-01", monthlyRent: "$1,126,409", percentIncrease: "1.75%", sourceDocument: "First Amendment" },
  ],
};
