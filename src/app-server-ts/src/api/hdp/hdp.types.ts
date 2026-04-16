/**
 * Type definitions for the HDP (Hybrid Data Platform) OData connector.
 * Exposes Salesforce objects via OData v4 at hdp.test.build.one.
 */

/** Resources exposed by this connector. */
export const RESOURCES = new Set(['OPPORTUNITIES']);

/**
 * Fields that do NOT support OData string functions (contains, startswith, endswith).
 * Derived from $metadata: Edm.Decimal, Edm.Double, Edm.Int32, Edm.Boolean, Edm.Date, Edm.DateTimeOffset.
 */
export const NON_STRING_FIELDS = new Set([
  // Decimal / Double / Int
  'AMOUNT',
  'PROBABILITY',
  'EXPECTEDREVENUE',
  'TOTALOPPORTUNITYQUANTITY',
  'REFERENCE_NUMBER__C',
  'PUSHCOUNT',
  'FISCALQUARTER',
  'FISCALYEAR',
  // Boolean
  'ISDELETED',
  'ISPRIVATE',
  'ISCLOSED',
  'ISWON',
  'HASOPPORTUNITYLINEITEM',
  'HASOPENACTIVITY',
  'HASOVERDUETASK',
  // Date / DateTimeOffset
  'CLOSEDATE',
  'LASTACTIVITYDATE',
  'LASTSTAGECHANGEDATE',
  'CREATEDDATE',
  'LASTMODIFIEDDATE',
  'SYSTEMMODSTAMP',
  'LASTVIEWEDDATE',
  'LASTREFERENCEDDATE'
]);

/** OData v4 collection response wrapper */
export interface ODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: T[];
}
