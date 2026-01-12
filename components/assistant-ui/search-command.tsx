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
  useAssistantApi,
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

  const handleThreadSelect = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

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
          <ThreadsContent onSelect={handleThreadSelect} />
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

const ThreadsContent: React.FC<{ onSelect: () => void }> = ({ onSelect }) => {
  const isLoading = useAssistantState(({ threads }) => threads.isLoading);
  const threadCount = useAssistantState(({ threads }) => threads.threadIds?.length ?? 0);

  if (!isLoading && threadCount === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No threads yet.
      </div>
    );
  }

  const ThreadItemComponent = React.useCallback(
    () => <ThreadItem onSelect={onSelect} />,
    [onSelect],
  );

  return (
    <ThreadListPrimitive.Root>
      <ThreadListPrimitive.Items
        components={{ ThreadListItem: ThreadItemComponent }}
      />
    </ThreadListPrimitive.Root>
  );
};

const ThreadItem: React.FC<{ onSelect: () => void }> = ({ onSelect }) => {
  const api = useAssistantApi();

  const handleSelect = React.useCallback(() => {
    api.threadListItem().switchTo();
    onSelect();
  }, [api, onSelect]);

  return (
    <ThreadListItemPrimitive.Root asChild>
      <CommandItem onSelect={handleSelect}>
        <MessageSquare />
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      </CommandItem>
    </ThreadListItemPrimitive.Root>
  );
};
