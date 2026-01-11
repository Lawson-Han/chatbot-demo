"use client";

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ThreadAssistantMessagePart,
  type ThreadMessage,
  useLocalRuntime,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const OFFLINE_REPLY = `This starter now runs fully offline with a predictable, repeatable answer so you can focus on layout and interactions. Nothing is sent over the network and there are no API keys to manage.

The response is intentionally verbose to stress-test scrolling, copy, and multi-paragraph rendering. Feel free to change this text to whatever long-form content you want to exercise the UI with.

You can type anything below - every prompt returns this exact block. The goal is to keep the template lean while still giving you enough content to validate the chat experience end to end.`;

const STREAMING_REASONING_STEPS = [
  "Reviewing the prompt and keeping this run in offline demo mode.",
  "Preparing deterministic reasoning notes so the shimmer and collapse states are visible.",
  "Streaming the final copy chunk by chunk to exercise the UI affordances.",
] as const;

const STREAMING_TIMING = {
  reasoningDelayMs: 300,
  textChunkDelayMs: 90,
  chunkSize: 72,
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
      { once: true },
    );
  });

const chunkAnswer = (text: string, chunkSize = STREAMING_TIMING.chunkSize) => {
  const paragraphs = text.trim().split("\n\n");

  return paragraphs.flatMap((paragraph, index) => {
    const words = paragraph.split(/\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > chunkSize && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
    }

    if (index < paragraphs.length - 1) {
      chunks.push("\n\n");
    }

    return chunks;
  });
};

const streamingAdapter: ChatModelAdapter = {
  async *run({ abortSignal, messages }) {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    const promptText =
      lastUserMessage?.content.find(
        (part): part is Extract<
          ThreadMessage["content"][number],
          { type: "text" }
        > => part.type === "text",
      )?.text ?? "";

    const answerChunks = chunkAnswer(
      promptText
        ? `You said: "${promptText}".\n\n${OFFLINE_REPLY}`
        : OFFLINE_REPLY,
      STREAMING_TIMING.chunkSize,
    );

    const reasoningSteps: string[] = [];
    for (const step of STREAMING_REASONING_STEPS) {
      reasoningSteps.push(step);
      const reasoningText = reasoningSteps.join("\n\n");
      const content: ThreadAssistantMessagePart[] = [
        { type: "reasoning", text: reasoningText },
      ];

      if (abortSignal.aborted) {
        yield {
          content,
          status: { type: "incomplete", reason: "cancelled" },
        };
        return;
      }

      yield {
        content,
        status: { type: "running" },
      };

      await sleep(STREAMING_TIMING.reasoningDelayMs, abortSignal);
    }

    const reasoningPart: ThreadAssistantMessagePart = {
      type: "reasoning",
      text: reasoningSteps.join("\n\n"),
    };

    let answerText = "";
    for (const chunk of answerChunks) {
      answerText += chunk;
      const content: ThreadAssistantMessagePart[] = [
        reasoningPart,
        { type: "text", text: answerText },
      ];

      if (abortSignal.aborted) {
        yield {
          content,
          status: { type: "incomplete", reason: "cancelled" },
        };
        return;
      }

      yield {
        content,
        status: { type: "running" },
      };

      await sleep(STREAMING_TIMING.textChunkDelayMs, abortSignal);
    }

    yield {
      content: [
        reasoningPart,
        {
          type: "text",
          text: answerText,
        },
      ],
      status: { type: "complete", reason: "stop" },
    };
  },
};

export const Assistant = () => {
  const runtime = useLocalRuntime(streamingAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Offline Chat Demo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
