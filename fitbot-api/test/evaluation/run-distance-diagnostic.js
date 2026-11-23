const { spawnSync } = require('node:child_process');

const composeFile = 'docker-compose.evaluation.yml';
const databaseUrl = 'postgresql://fitbot_eval:fitbot_eval_password@localhost:55432/fitbot_eval';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

let started = false;

try {
  run('docker', ['compose', '-f', composeFile, 'up', '-d', '--wait']);
  started = true;
  run('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_URL_UNPOOLED: databaseUrl },
  });
  run('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'test/evaluation/distance-diagnostic.script.ts'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_URL_UNPOOLED: databaseUrl },
  });
} finally {
  if (started) {
    spawnSync('docker', ['compose', '-f', composeFile, 'down', '-v', '--remove-orphans'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  }
}
