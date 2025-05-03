declare module 'axios-retry' {
  import { AxiosError, AxiosInstance } from 'axios';

  export interface IAxiosRetryConfig {
    retries?: number;
    retryCondition?: (error: AxiosError) => boolean;
    retryDelay?: (retryCount: number, error?: AxiosError) => number;
    shouldResetTimeout?: boolean;
    onRetry?: (retryCount: number, error: AxiosError, requestConfig: any) => void;
  }

  export default function axiosRetry(
    axios: AxiosInstance, 
    config?: IAxiosRetryConfig
  ): void;

  export function isNetworkOrIdempotentRequestError(error: AxiosError): boolean;
  export function isRetryableError(error: AxiosError): boolean;
  export function isIdempotentRequestError(error: AxiosError): boolean;
  export function isNetworkError(error: AxiosError): boolean;
  export function exponentialDelay(retryNumber: number): number;
} 