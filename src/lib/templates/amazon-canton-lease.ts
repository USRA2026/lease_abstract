import type { SeedAbstract } from "./types";

/**
 * Partial abstract seeded from the "Amazon (Canton ECommerce) Lease"
 * screenshots: only the General section has been abstracted so far, which
 * is intentional — it demonstrates an in-progress abstract (percent
 * complete < 100) alongside the two fully-complete showcase abstracts.
 */
export const amazonCantonLease: SeedAbstract = {
  name: "Amazon (Canton ECommerce) Lease",
  kind: "LEASE",
  assetName: "Amazon Last Mile",
  documents: [
    { acronym: "1A", title: "First Amendment To Lease", fileName: "Canton Ecommerce Property LLC - First Amendment to Lease (Executable)70-1.pdf" },
    { acronym: "BL", title: "Lease Agreement", fileName: "Canton Ecommerce Property LLC - Lease Agreement (F.EXE) (2021-08-24).pdf" },
    { acronym: "NLTD", title: "Notice Of Lease Term Dates", fileName: "Canton ECommerce Property LLC-Notice of Lease Term Dates_2022-11-4.pdf" },
    { acronym: "2A", title: "Second Amendment To Lease And Acknowledgement", fileName: "Canton Ecommerce Property LLC - Fully Executed Second Amendment to Lease.pdf" },
  ],
  sections: [
    {
      name: "General",
      fields: [
        { key: "tenantName", label: "Tenant Name", fieldType: "TEXT", value: "Amazon.com Services LLC", citation: { acronym: "BL", page: "p. 1" } },
        { key: "squareFeet", label: "Square Feet", fieldType: "TEXT", value: "183,130 square feet", citation: { acronym: "BL", page: "p. 1" } },
        { key: "premisesDescription", label: "Premises Description", fieldType: "LONG_TEXT", value: "All portions of the Building and the Land as depicted on Exhibit A.", citation: { acronym: "BL", page: "p. 1" } },
        { key: "propertyAddress", label: "Property Address", fieldType: "TEXT", value: "48600 Michigan Avenue", citation: { acronym: "BL", sectionRef: "§ Ex. F" } },
        { key: "propertyCityStateZip", label: "Property City, State, Zip", fieldType: "TEXT", value: "Canton, MI 48188", citation: { acronym: "BL", sectionRef: "§ Ex. F" } },
        { key: "guarantorName", label: "Guarantor", fieldType: "TEXT", value: "Amazon.com, Inc.", citation: { acronym: "BL", page: "p. 1" } },
        {
          key: "permittedUse",
          label: "Permitted Use",
          fieldType: "LONG_TEXT",
          value:
            'Tenant may use the Premises for the purpose of receiving, storing, assembling, shipping, distributing, preparing, selling, and serving as pick-up/drop-off location for products, materials, food, grocery, and liquor items; parking, storage, and use (including driving into and through the Building for loading, unloading and parking inside of the Building) of automobiles, trucks, machinery, and trailers, including outdoor loading and unloading; outdoor storage of Tenant\'s Property; printing; making products on demand; warehouse and office use; ancillary and related uses for any of the foregoing; and, so long as the named Tenant as of the Effective Date or any Tenant Affiliate is the tenant hereunder, any other use in compliance with Legal Requirements (provided that if the tenant hereunder is an unaffiliated Transferee, then any other use in compliance with Legal Requirements will be allowed, subject to Landlord\'s prior consent) (all of the above being "Permitted Uses").',
          citation: { acronym: "BL", sectionRef: "§ 3(a)" },
        },
        { key: "landlordEntity", label: "Landlord Entity", fieldType: "TEXT", value: "Canton Ecommerce Property LLC", citation: { acronym: "BL", page: "p. 1" } },
      ],
    },
  ],
};
