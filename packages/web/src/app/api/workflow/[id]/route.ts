// GET /api/workflow/[id] - Get workflow status and result
// Frontend polls this every 2s while running (simpler than websockets for a demo)

import { NextRequest, NextResponse } from 'next/server';
import { getTemporalClient } from '@/lib/temporal-client';
import type {
  WorkflowStatusResponse,
  ApiErrorResponse,
  WorkflowProgress,
  ResearchTaskResult,
} from '@workflow-agent/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<WorkflowStatusResponse | ApiErrorResponse>> {
  try {
    const workflowId = params.id;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();
    const status = description.status.name as WorkflowStatusResponse['status'];

    const response: WorkflowStatusResponse = {
      workflowId,
      status,
      startTime: description.startTime?.toISOString(),
      closeTime: description.closeTime?.toISOString(),
    };

    if (status === 'RUNNING') {
      try {
        const progress = await handle.query<WorkflowProgress>('getProgress');
        response.progress = progress;
      } catch (queryError) {
        // Query might fail if workflow hasn't set up handler yet - that's fine
        console.log(`[API] Could not query progress for ${workflowId}:`, queryError);
      }
    }

    if (status === 'COMPLETED') {
      try {
        const result = await handle.result() as ResearchTaskResult;
        response.result = result;
      } catch (resultError) {
        console.error(`[API] Could not get result for ${workflowId}:`, resultError);
      }
    }

    if (status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT') {
      try {
        const result = await handle.result() as ResearchTaskResult;
        response.result = result;
      } catch (resultError) {
        response.result = {
          status: 'failed',
          query: '',
          error: resultError instanceof Error ? resultError.message : 'Workflow failed',
          metadata: {},
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[API] Failed to get workflow status:`, error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Workflow not found', code: 'WORKFLOW_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get workflow status',
        code: 'STATUS_QUERY_FAILED',
        details: error instanceof Error ? { message: error.message } : undefined,
      },
      { status: 500 }
    );
  }
}
