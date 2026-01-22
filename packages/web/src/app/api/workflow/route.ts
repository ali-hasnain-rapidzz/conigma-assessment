// POST /api/workflow - Start a new research workflow
// Frontend talks to this, not Temporal directly (keeps things decoupled)

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTemporalClient } from '@/lib/temporal-client';
import {
  TASK_QUEUE,
  WORKFLOW_EXECUTION_TIMEOUT,
  type StartWorkflowRequest,
  type StartWorkflowResponse,
  type ApiErrorResponse,
} from '@workflow-agent/shared';

export async function POST(request: NextRequest): Promise<NextResponse<StartWorkflowResponse | ApiErrorResponse>> {
  try {
    const body: StartWorkflowRequest = await request.json();
    const { task } = body;

    if (!task || !task.query) {
      return NextResponse.json(
        { error: 'Task with query is required', code: 'MISSING_QUERY' },
        { status: 400 }
      );
    }

    if (task.query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters', code: 'QUERY_TOO_SHORT' },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();
    const workflowId = `research-${uuidv4()}`;

    const handle = await client.workflow.start('researchAgentWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [
        {
          query: task.query.trim(),
          maxSources: task.maxSources ?? 5,
          enableFactChecking: task.enableFactChecking ?? true,
        },
      ],
      workflowExecutionTimeout: WORKFLOW_EXECUTION_TIMEOUT,
    });

    console.log(`[API] Started workflow: ${workflowId}`);

    return NextResponse.json({
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      status: 'started',
    });
  } catch (error) {
    console.error('[API] Failed to start workflow:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to start research workflow',
        code: 'WORKFLOW_START_FAILED',
        details: error instanceof Error ? { message: error.message } : undefined,
      },
      { status: 500 }
    );
  }
}
