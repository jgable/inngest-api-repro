import { EventSchemas, GetEvents, Inngest } from "inngest";
import { serve } from "inngest/next";

export const eventSchemas = new EventSchemas().fromRecord<{
  "merge/merge-all": {
    data: undefined;
  };
  "merge/merge-locations": {
    data: {
      splc: string;
      locations: Array<{
        provider: string;
        id: string;
      }>;
    }
  };
}>();

export const client = new Inngest({
  id: "inngest-api-repro",
  schemas: eventSchemas,
});

export type InngestEvents = GetEvents<typeof client>;

const mergeAll = client.createFunction(
  {
    name: "Merge: Merge all",
    id: "merge-all",

    concurrency: {
      limit: 1,
    }
  },
  { event: "merge/merge-all" },
  async ({step}) => {
    const locations = await step.run("fetch-locations", async () => {
      // Generate dummy locations
      return Array.from({length: 20}, (_, n) => n).map(idx => ({
        splc: `splc-${idx + 1}`,
        locations: [] as Array<{provider: string, id: string}>,
      }));
    });

    // Send off merge locations events
    const locationMergeEvents = locations.map(location => {
      return {
        name: "merge/merge-locations",
        data: {
          splc: location.splc,
          locations: location.locations,
        },
      } as InngestEvents["merge/merge-locations"];
    });
    const {ids} = await step.sendEvent("send-location-merges", locationMergeEvents);

    await step.sleep("sleep-for-events", "3s");

    return {
      success: true,
      ids,
    };
  }
)

const mergeLocations = client.createFunction(
  {
    name: "Merge: Merge locations",
    id: "merge-locations",

    batchEvents: {
      maxSize: 10,
      timeout: "2s",
    },

    // Run only 3 of these jobs at a time per org
    concurrency: {
      limit: 3,
    },
  },
  { event: "merge/merge-locations" },
  async ({step, events}) => {
    for (const event of events) {
      const {splc} = event.data;
      // Substituted implementation for step.sleep
      await step.sleep(`process-location-${splc}`, "1s");
    }
  }
)

export default serve({
  client,
  functions: [
    mergeAll,
    mergeLocations,
  ],
  logLevel: "warn",
});