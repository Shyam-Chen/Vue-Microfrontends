/// <reference types="vite-plugin-vue-routes/client" />

declare namespace NodeJS {
  export interface ProcessEnv {
    PRODUCT_URL: string;
    ORDER_URL: string;
  }
}
