/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESCROW_ADDRESS?: string;
  readonly VITE_FEE_RECIPIENT?: string;
  readonly VITE_FEE_BPS?: string;
}
