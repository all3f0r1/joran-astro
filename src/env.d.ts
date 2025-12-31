// src/env.d.ts
declare namespace App {
  interface Locals {
    runtime: import('@astrojs/cloudflare').Runtime<Env>;
  }
}
