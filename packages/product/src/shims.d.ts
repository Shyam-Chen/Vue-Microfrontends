/// <reference types="vite-plugin-vue-routes/client" />

declare namespace NodeJS {
  export interface ProcessEnv {
    PORTAL_URL: string;
    ORDER_URL: string;
  }
}
