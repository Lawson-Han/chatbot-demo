"use client";

import * as React from "react";
import {
  Inbox,
  MessageCircleQuestion,
  MessageSquare,
  Settings2,
} from "lucide-react";
import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
  useAssistantState,
} from "@assistant-ui/react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const suggestions = [
    { title: "Inbox", icon: Inbox },
    { title: "Settings", icon: Settings2 },
    { title: "Help", icon: MessageCircleQuestion },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.title}>
                <Icon />
                {item.title}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Threads">
          <ThreadsContent />
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

const ThreadsContent: React.FC = () => {
  const isLoading = useAssistantState(({ threads }) => threads.isLoading);
  const threadCount = useAssistantState(({ threads }) => threads.threadIds?.length ?? 0);

  if (!isLoading && threadCount === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No threads yet.
      </div>
    );
  }

  return (
    <ThreadListPrimitive.Root>
      <ThreadListPrimitive.Items components={{ ThreadListItem: ThreadItem }} />
    </ThreadListPrimitive.Root>
  );
};

const ThreadItem: React.FC = () => {
  return (
    <ThreadListItemPrimitive.Root asChild>
      <ThreadListItemPrimitive.Trigger asChild>
        <CommandItem>
          <MessageSquare />
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </CommandItem>
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  );
};
