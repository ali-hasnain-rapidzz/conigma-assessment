// Singleton - Temporal connections are expensive, so we reuse one
import { Client, Connection } from '@temporalio/client';
import { TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE } from '@workflow-agent/shared';

let client: Client | null = null;
let connectionPromise: Promise<Client> | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (client) {
    return client;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS ?? TEMPORAL_ADDRESS,
    });

    client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? TEMPORAL_NAMESPACE,
    });

    return client;
  })();

  return connectionPromise;
}
