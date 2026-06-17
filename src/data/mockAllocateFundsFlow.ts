export const MIN_ALLOCATE_AMOUNT = 1000;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function mockSubmitAllocation(input: {
  branchId: string;
  branchName: string;
  amount: number;
  note?: string;
}): Promise<{ reference: string }> {
  await delay(1200);

  if (input.note?.toLowerCase().includes('fail-demo')) {
    throw new Error('Allocation could not be completed');
  }

  return {
    reference: `BEL-BIZ-ALLOC-${Date.now()}`,
  };
}
