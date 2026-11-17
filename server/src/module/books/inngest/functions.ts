import { NonRetriableError } from "inngest";
import { eq } from "drizzle-orm";
import { inngest } from "../../../common/inngest/client.js";
import db from "../../../common/db/index.js";
import { books } from "../book.schema.js";
import { BookInputError, extractAndStoreBlocks, indexBookWindow, mergeAndSaveIndex } from "../book_pipeline.js";
import { markBookFailed } from "../book.service.js";
import type { WindowResult } from "../book_windows.js";
import { bindUsageContext, withUsageSteps } from "../../../common/agent/usage_context.js";

// Windows are indexed in parallel waves of this size, which keeps a large book under the model's rate limits.
const WINDOW_WAVE_SIZE = 6;

/**
 * Indexes one uploaded book: extract blocks → index 10-page windows in parallel → merge and save.
 * Only one indexing run per book at a time; each window is its own step, so a retry resumes where it failed.
 */
export const indexBookFunction = inngest.createFunction(
    {
        id: "book-index",
        retries: 2,
        concurrency: { key: "event.data.bookId", limit: 1 },
        triggers: [{ event: "book/index" }],
        // Runs once all retries are used up, including failures that never reach the handler below
        // (e.g. a request Inngest couldn't deliver), so a book never stays "processing" forever.
        onFailure: async ({ event, error }) => {
            const bookId = (event.data.event.data as { bookId?: string }).bookId;
            if (bookId) await markBookFailed(bookId, error?.message || "Indexing failed");
        },
    },
    async ({ event, step }) => {
        const bookId = event.data.bookId as string;
        // Indexing a book uses AI: logged against the teacher who uploaded it, and their organisation.
        const [book] = await db.select({ createdBy: books.createdBy, organisationId: books.organisationId }).from(books).where(eq(books.id, bookId));
        if (book) {
            const usage = { userId: book.createdBy, organisationId: book.organisationId };
            bindUsageContext(usage);
            step = withUsageSteps(step, usage);
        }

        try {
            const plan = await step.run("extract-blocks", async () => {
                try {
                    return await extractAndStoreBlocks(bookId);
                } catch (err) {
                    if (err instanceof BookInputError) throw new NonRetriableError(err.message);
                    throw err;
                }
            });

            const results: WindowResult[] = [];
            for (let i = 0; i < plan.windows.length; i += WINDOW_WAVE_SIZE) {
                const wave = plan.windows.slice(i, i + WINDOW_WAVE_SIZE);
                const waveResults = await Promise.all(
                    wave.map((window) => step.run(`index-window-${window.index}`, () => indexBookWindow(bookId, window)))
                );
                results.push(...(waveResults as WindowResult[]));
            }

            await step.run("merge-and-save", async () => {
                await mergeAndSaveIndex(bookId, results);
            });
        } catch (err: any) {
            await markBookFailed(bookId, err?.message || "Unknown error indexing book");
            throw err;
        }
    }
);

export const bookFunctions = [indexBookFunction];
