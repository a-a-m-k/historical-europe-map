declare module "critical" {
  export interface CriticalGenerateOptions {
    [key: string]: unknown;
  }

  export interface CriticalGenerateResult {
    html?: string;
    css?: string;
  }

  export function generate(
    options: CriticalGenerateOptions
  ): Promise<CriticalGenerateResult>;

  const criticalDefault: typeof generate;
  export default criticalDefault;
}
