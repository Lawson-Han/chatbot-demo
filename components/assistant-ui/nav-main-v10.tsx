"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CommandShortcut } from "@/components/ui/command";

export function NavMain({
  items,
  onItemClick,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    shortcut?: string;
  }[];
  onItemClick?: (item: { title: string; url: string }) => void;
}) {
  const handleClick = (
    e: React.MouseEvent,
    item: { title: string; url: string }
  ) => {
    if (onItemClick) {
      e.preventDefault();
      onItemClick(item);
    }
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <a href={item.url} onClick={(e) => handleClick(e, item)}>
              <item.icon />
              <span>{item.title}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
