// Gera src/lib/api/schema.d.ts a partir do OpenAPI do backend.
// Uso: com a API rodando, `npm run gen:api`. Outra origem: OPENAPI_URL=https://... npm run gen:api
import { writeFile } from 'node:fs/promises';

import openapiTS, { astToString } from 'openapi-typescript';

const source = process.env.OPENAPI_URL ?? 'http://localhost:8000/openapi.json';
const target = new URL('../src/lib/api/schema.d.ts', import.meta.url);
const header =
  '// Gerado por `npm run gen:api` a partir do OpenAPI do backend. Não edite à mão.\n\n';

const ast = await openapiTS(new URL(source));
await writeFile(target, header + astToString(ast));
console.log(`Tipos gerados a partir de ${source}`);
