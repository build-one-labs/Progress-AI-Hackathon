import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, MethodNotAllowedException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { buildODataParams } from './hdp.filter';
import { RESOURCES, type ODataResponse } from './hdp.types';

import type { IDataConnector } from '@buildone/app-server-tslib/modules';
import type { QueryObject } from '@buildone/app-server-tslib/utils';

/** Default HDP base URL. Override with HDP_API_BASE_URL env var. */
const DEFAULT_BASE_URL = 'https://hdp.test.build.one';

/** OData dataset path for Salesforce objects */
const DATASET_PATH = 'api/odata4/hackathon_salesforce';

@Injectable()
export class HdpConnector implements IDataConnector {
  private readonly logger = new Logger(HdpConnector.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.HDP_API_BASE_URL ?? DEFAULT_BASE_URL;
  }

  /**
   * Build Basic Auth header.
   * Credentials: username = d2cadmin, password = <standard PW>Admin
   * Override via HDP_USERNAME / HDP_PASSWORD environment variables.
   */
  private getAuthHeaders(): Record<string, string> {
    const username = process.env.HDP_USERNAME ?? 'd2cadmin';
    const password = process.env.HDP_PASSWORD ?? 'AdminAdmin';
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
      Accept: 'application/json'
    };
  }

  async fetch(object: string, query: QueryObject<unknown>): Promise<any> {
    const resource = object.toUpperCase();
    if (!RESOURCES.has(resource)) {
      this.logger.warn(`Unknown HDP resource requested: ${object}`);
    }

    const url = `${this.baseUrl}/${DATASET_PATH}/${resource}`;
    const params = buildODataParams(query);

    this.logger.log(`HDP fetch: GET ${url} filter=${params.$filter ?? '(none)'} top=${params.$top ?? '(none)'}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<ODataResponse<unknown>>(url, {
          headers: this.getAuthHeaders(),
          params,
          timeout: 30000,
          // HDP OData server treats '+' as arithmetic operator, not space.
          // Override axios default URLSearchParams serialization (%20 instead of +).
          paramsSerializer: (p: Record<string, string>) =>
            Object.entries(p)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join('&')
        })
      );
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.value)) return data.value;
      return [data];
    } catch (error: any) {
      const status: number | undefined = error?.response?.status;
      const odataMessage: string | undefined = error?.response?.data?.error?.message;
      const detail = odataMessage
        ? `OData error ${status}: ${odataMessage} — filter: ${params.$filter ?? '(none)'}`
        : `HTTP ${status ?? 'unknown'}: ${(error as Error).message}`;
      this.logger.error(`HDP fetch failed for ${resource}: ${detail}`);
      throw new Error(`HDP [${resource}] ${detail}`);
    }
  }

  async create(_object: string, _records: Record<string, unknown>[]): Promise<unknown[]> {
    throw new MethodNotAllowedException('HDP connector is read-only');
  }

  async update(_object: string, _records: Record<string, unknown>[]): Promise<unknown[]> {
    throw new MethodNotAllowedException('HDP connector is read-only');
  }

  async delete(_object: string, _ids: string[]): Promise<void> {
    throw new MethodNotAllowedException('HDP connector is read-only');
  }
}
