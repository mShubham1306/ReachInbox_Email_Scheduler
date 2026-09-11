import { generateEtherealCredentials } from '../integrations/smtp/ethereal';

async function run() {
  console.log('Generating Ethereal test credentials...');
  await generateEtherealCredentials();
  process.exit(0);
}

run();
