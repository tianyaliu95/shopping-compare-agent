import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runCompareAgent } from '../lib/agent';
import { LOCALES, TYPE_EXAMPLES } from '../lib/i18n';
import type { AgentEvent } from '../lib/types';
import type { Seed } from '../lib/seeds';

const GAP_MS = 8_000;
const OUT = path.resolve('lib/seeds/examples.json');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set. Run with: npm run seed');
    process.exit(1);
  }

  const capturedAt = new Date().toISOString().slice(0, 10);
  const seeds: Seed[] = [];

  for (const locale of LOCALES) {
    for (const example of TYPE_EXAMPLES[locale]) {
      const events: AgentEvent[] = [];
      process.stdout.write(`-> ${locale}/${example.id} ... `);

      try {
        await runCompareAgent({
          apiKey,
          products: example.products,
          preference: example.preference,
          locale,
          onEvent: (event) => {
            if (event.type === 'tool' || event.type === 'result') events.push(event);
          },
        });
      } catch (err) {
        console.log(`failed (${err instanceof Error ? err.message : 'unknown'})`);
        await sleep(GAP_MS);
        continue;
      }

      if (!events.some((event) => event.type === 'result')) {
        console.log('failed (no result)');
        await sleep(GAP_MS);
        continue;
      }

      seeds.push({
        id: example.id,
        locale,
        products: example.products,
        preference: example.preference,
        capturedAt,
        events,
      });
      console.log(`ok (${events.filter((e) => e.type === 'tool').length} tool calls)`);
      await sleep(GAP_MS);
    }
  }

  await writeFile(OUT, `${JSON.stringify(seeds, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${seeds.length} seed(s) to ${path.relative(process.cwd(), OUT)}`);
}

void main();
