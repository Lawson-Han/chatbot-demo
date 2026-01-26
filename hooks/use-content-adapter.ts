"use client";

import { useCallback, useRef } from "react";
import type { ChatModelAdapter, ThreadAssistantMessagePart, ThreadMessage } from "@assistant-ui/react";
import { getNextSegment, listResources } from "@/lib/resource-library";

const OFFLINE_REPLY = `This is a demo response. Upload a text resource using the attachment button to start reading content in segments.`;

const STREAMING_TIMING = {
    reasoningDelayMs: 200,
    textChunkDelayMs: 50,
    chunkSize: 100,
} as const;

const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }

        const timeout = setTimeout(resolve, ms);
        signal.addEventListener(
            "abort",
            () => {
                clearTimeout(timeout);
                resolve();
            },
            { once: true }
        );
    });

const chunkText = (text: string, chunkSize: number) => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
};

/**
 * Creates a chat model adapter that delivers content segments from resources.
 * When a resource is available, it delivers the next segment; otherwise falls back to demo mode.
 */
export const useContentAdapter = () => {
    const activeResourceRef = useRef<string | null>(null);

    const setActiveResource = useCallback((resourceId: string | null) => {
        activeResourceRef.current = resourceId;
    }, []);

    const adapter: ChatModelAdapter = {
        async *run({ abortSignal }) {
            // Try to find an active resource with remaining segments
            let segmentResult = null;
            let resourceId = activeResourceRef.current;

            // If no active resource, try to find any resource with unread segments
            if (!resourceId) {
                try {
                    const resources = await listResources();
                    const unfinished = resources.find(
                        (r) => r.segmentCount > 0 && r.readingPosition < r.segmentCount
                    );
                    if (unfinished) {
                        resourceId = unfinished.id;
                        activeResourceRef.current = resourceId;
                    }
                } catch {
                    // Ignore errors, fall back to demo mode
                }
            }

            // Try to get next segment from active resource
            if (resourceId) {
                try {
                    segmentResult = await getNextSegment(resourceId);
                } catch {
                    // Ignore errors, fall back to demo mode
                }
            }

            // If no segment available, use demo mode
            const contentText = segmentResult?.segment ?? OFFLINE_REPLY;
            const progressInfo = segmentResult
                ? `[${segmentResult.position + 1}/${segmentResult.totalSegments}]`
                : "";

            // Stream the content with simulated typing effect
            const chunks = chunkText(contentText, STREAMING_TIMING.chunkSize);
            let streamedText = "";

            // Optional: Add progress indicator as reasoning
            const reasoningParts: ThreadAssistantMessagePart[] = progressInfo
                ? [{ type: "reasoning", text: `Reading progress: ${progressInfo}` }]
                : [];

            for (const chunk of chunks) {
                streamedText += chunk;

                if (abortSignal.aborted) {
                    yield {
                        content: [...reasoningParts, { type: "text", text: streamedText }],
                        status: { type: "incomplete", reason: "cancelled" },
                    };
                    return;
                }

                yield {
                    content: [...reasoningParts, { type: "text", text: streamedText }],
                    status: { type: "running" },
                };

                await sleep(STREAMING_TIMING.textChunkDelayMs, abortSignal);
            }

            // Final yield with complete status
            yield {
                content: [...reasoningParts, { type: "text", text: streamedText }],
                status: { type: "complete", reason: "stop" },
            };

            // If there's no more content, clear active resource
            if (segmentResult && !segmentResult.hasMore) {
                activeResourceRef.current = null;
            }
        },
    };

    return { adapter, setActiveResource };
};
