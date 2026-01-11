"use client";

import {
  ArchiveIcon,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import { Skeleton } from "@/components/ui/skeleton";

export function NavFavorites({ showNewButton = true }: { showNewButton?: boolean }) {
  const { isMobile } = useSidebar();
  const isLoading = useAssistantState(({ threads }) => threads.isLoading);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Threads</SidebarGroupLabel>
      <ThreadListPrimitive.Root>
        <SidebarMenu>
          {showNewButton && <ThreadListNew />}
          {isLoading ? (
            <ThreadListSkeleton />
          ) : (
            <ThreadListPrimitive.Items components={{ ThreadListItem }} />
          )}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </ThreadListPrimitive.Root>
    </SidebarGroup>
  );
}

const ThreadListNew: React.FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="#">
            <Plus />
            <span>New Thread</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </ThreadListPrimitive.New>
  );
};

const ThreadListSkeleton: React.FC = () => {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuButton disabled>
            <Skeleton className="h-4 w-full" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

const ThreadListItem: React.FC = () => {
  const { isMobile } = useSidebar();

  return (
    <ThreadListItemPrimitive.Root asChild>
      <SidebarMenuItem>
        <ThreadListItemPrimitive.Trigger asChild>
          <SidebarMenuButton asChild>
            <a href="#">
              <span>
                <ThreadListItemPrimitive.Title fallback="New Chat" />
              </span>
            </a>
          </SidebarMenuButton>
        </ThreadListItemPrimitive.Trigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <MoreHorizontal />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <ThreadListItemPrimitive.Archive asChild>
              <DropdownMenuItem>
                <ArchiveIcon className="text-muted-foreground" />
                <span>Archive</span>
              </DropdownMenuItem>
            </ThreadListItemPrimitive.Archive>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </ThreadListItemPrimitive.Root>
  );
};
