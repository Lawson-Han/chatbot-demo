"use client";

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
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

const offlineAdapter: ChatModelAdapter = {
  async run({ abortSignal }) {
    if (abortSignal.aborted) {
      return { status: { type: "incomplete", reason: "cancelled" } };
    }

    return {
      content: [{ type: "text", text: OFFLINE_REPLY }],
      status: { type: "complete", reason: "unknown" },
    };
  },
};

export const Assistant = () => {
  const runtime = useLocalRuntime(offlineAdapter);

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
