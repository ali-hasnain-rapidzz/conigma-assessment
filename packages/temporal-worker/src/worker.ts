import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE, TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE } from '@workflow-agent/shared';

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? TEMPORAL_ADDRESS,
  });

  try {
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? TEMPORAL_NAMESPACE,
      taskQueue: TASK_QUEUE,
      // workflows loaded by path so Temporal can sandbox them for determinism
      workflowsPath: require.resolve('./workflows'),
      activities,
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 5,
    });

    console.log('='.repeat(50));
    console.log('Temporal Worker Started');
    console.log('='.repeat(50));
    console.log(`Task Queue: ${TASK_QUEUE}`);
    console.log(`Namespace: ${process.env.TEMPORAL_NAMESPACE ?? TEMPORAL_NAMESPACE}`);
    console.log(`Address: ${process.env.TEMPORAL_ADDRESS ?? TEMPORAL_ADDRESS}`);
    console.log('='.repeat(50));

    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
