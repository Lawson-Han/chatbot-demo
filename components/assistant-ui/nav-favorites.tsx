"use client";

import {
  ArchiveIcon,
  Edit,
  MoreHorizontal,
  Plus,
  Trash2,
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
  useThreadListItemRuntime,
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
      <SidebarMenuItem className="group/item">
        <SidebarMenuButton
          asChild
          className="group-data-[active=true]/item:bg-sidebar-accent group-data-[active=true]/item:text-sidebar-accent-foreground"
        >
          <button type="button" className="flex w-full items-center gap-2">
            <Plus />
            <span>New Thread</span>
          </button>
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
  const threadListItemRuntime = useThreadListItemRuntime();

  const handleRename = async () => {
    const newTitle = prompt("Enter new thread title:");
    if (newTitle && newTitle.trim()) {
      await threadListItemRuntime.rename(newTitle.trim());
    }
  };

  return (
    <ThreadListItemPrimitive.Root asChild>
      <SidebarMenuItem className="group/item data-[active=true]:bg-sidebar-accent/30 data-[active=true]:text-sidebar-accent-foreground">
        <ThreadListItemPrimitive.Trigger asChild>
          <SidebarMenuButton
            asChild
            className="group-data-[active=true]/item:bg-sidebar-accent group-data-[active=true]/item:text-sidebar-accent-foreground"
          >
            <button type="button" className="flex w-full items-center gap-2">
              <span>
                <ThreadListItemPrimitive.Title fallback="New Chat" />
              </span>
            </button>
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
            <DropdownMenuItem onClick={handleRename}>
              <Edit className="text-muted-foreground" />
              <span>Rename</span>
            </DropdownMenuItem>
            <ThreadListItemPrimitive.Archive asChild>
              <DropdownMenuItem>
                <ArchiveIcon className="text-muted-foreground" />
                <span>Archive</span>
              </DropdownMenuItem>
            </ThreadListItemPrimitive.Archive>
            <ThreadListItemPrimitive.Delete asChild>
              <DropdownMenuItem>
                <Trash2 className="text-muted-foreground" />
                <span>Delete</span>
              </DropdownMenuItem>
            </ThreadListItemPrimitive.Delete>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </ThreadListItemPrimitive.Root>
  );
};
