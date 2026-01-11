"use client";

import * as React from "react";
import {
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Plus,
  Search,
  Settings2,
  SquarePen,
  Trash2,
} from "lucide-react";

import { NavFavorites } from "@/components/assistant-ui/nav-favorites";
import { NavMain } from "@/components/assistant-ui/nav-main-v10";
import { NavSecondary } from "@/components/assistant-ui/nav-secondary";
import { NavUser } from "@/components/assistant-ui/nav-user";
import { SearchCommand } from "@/components/assistant-ui/search-command";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { CommandShortcut } from "@/components/ui/command";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Sample data matching sidebar-10 structure
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Search,
      shortcut: "⌘K",
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
  ],
};

const HomeButton: React.FC = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <a href="#">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Command className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Acme Inc</span>
              <span className="truncate text-xs">Enterprise</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const NewChatButton: React.FC = () => {
  const newChatRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key === "o" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        !e.repeat
      ) {
        e.preventDefault();
        newChatRef.current?.click();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <ThreadListPrimitive.New asChild>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a ref={newChatRef} href="#">
              <SquarePen />
              <span>New Chat</span>
              <CommandShortcut>⇧⌘O</CommandShortcut>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </ThreadListPrimitive.New>
  );
};

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleItemClick = (item: { title: string; url: string }) => {
    if (item.title === "Search") {
      setCommandOpen(true);
    }
  };

  return (
    <>
      <SearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
      <Sidebar className="border-r-0" collapsible="icon" {...props}>
        <SidebarHeader>
          <HomeButton />
          <NewChatButton />
          <NavMain items={data.navMain} onItemClick={handleItemClick} />
        </SidebarHeader>
        <SidebarContent>
          <NavFavorites showNewButton={false} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
