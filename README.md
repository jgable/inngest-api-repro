## Inngest Repro

This is a repo with a reproduction of a problem with the Inngest Dev Server batching events stream.

## Steps

1. Install dependencies; `pnpm i`
2. In one terminal, run `pnpm dev` to start the server
3. In another terminal, run `pnpm dev:inngest` to start the Inngest dev server
4. Invoke the `merge/merge-all` function from the Inngest dev server
5. Navigate to the "Streams" page

Expected: Streams page shows 2 batches of events from the 20 events that were sent.

Actual: Streams page shows 20 events with many saying "No functions called" and 2 saying "Batch 1"

In addition, you can click "Show Internal Events" and see the function calls that pass multiple events to the merge/merge-locations function.