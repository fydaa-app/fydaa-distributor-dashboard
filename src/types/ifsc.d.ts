declare module "ifsc" {
  interface IfscDetails {
    BANK: string;
    BRANCH: string;
    ADDRESS: string;
    CITY: string;
    STATE: string;
    [key: string]: unknown;
  }

  interface IfscModule {
    fetchDetails(code: string): Promise<IfscDetails>;
  }

  const ifsc: IfscModule;
  export default ifsc;
}
