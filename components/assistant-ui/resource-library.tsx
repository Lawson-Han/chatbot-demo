"use client";

import {
  ArchiveIcon,
  FileText,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useResourceLibrary } from "@/hooks/use-resource-library";
import {
  archiveResource,
  removeResource,
  renameResource,
  type ResourceSummary,
} from "@/lib/resource-library";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const ResourceLibrary = () => {
  const { resources, isLoading } = useResourceLibrary();
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Resource Library</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          <ResourceLibrarySkeleton />
        ) : resources.length ? (
          resources.map((resource) => (
            <ResourceLibraryItem
              key={resource.id}
              resource={resource}
              isMobile={isMobile}
            />
          ))
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-sidebar-foreground/60">
              <span>No resources yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

const ResourceLibraryItem = ({
  resource,
  isMobile,
}: {
  resource: ResourceSummary;
  isMobile: boolean;
}) => {
  const handleRename = async () => {
    const newName = prompt("Enter new resource name:");
    if (!newName?.trim()) return;

    const toastId = toast.loading("Renaming resource...");
    try {
      await renameResource(resource.id, newName);
      toast.success("Resource renamed.", { id: toastId });
    } catch {
      toast.error("Failed to rename resource.", { id: toastId });
    }
  };

  const handleArchive = async () => {
    const toastId = toast.loading("Archiving resource...");
    try {
      await archiveResource(resource.id);
      toast.success("Resource archived.", { id: toastId });
    } catch {
      toast.error("Failed to archive resource.", { id: toastId });
    }
  };

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting resource...");
    try {
      await removeResource(resource.id);
      toast.success("Resource deleted.", { id: toastId });
    } catch {
      toast.error("Failed to delete resource.", { id: toastId });
    }
  };

  // Calculate progress percentage
  const progressPercent =
    resource.segmentCount > 0
      ? Math.round((resource.readingPosition / resource.segmentCount) * 100)
      : 0;

  return (
    <SidebarMenuItem className="group/item">
      <SidebarMenuButton asChild>
        <button type="button" className="flex w-full items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <div className="flex flex-1 flex-col items-start overflow-hidden">
            <span className="truncate w-full text-left">{resource.name}</span>
            {resource.segmentCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {resource.readingPosition} / {resource.segmentCount} ({progressPercent}%)
              </span>
            )}
          </div>
        </button>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-40 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
        >
          <DropdownMenuItem onClick={handleRename}>
            <PenLine className="text-muted-foreground" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <ArchiveIcon className="text-muted-foreground" />
            <span>Archive</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            <Trash2 />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

const ResourceLibrarySkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton disabled>
            <Skeleton className="h-4 w-full" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};
