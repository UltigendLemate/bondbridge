import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Share2, Flag, Trash, UserX, Settings } from "lucide-react";
import { ReactNode } from "react";

export interface MenuItemProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export interface ThreeDotsMenuProps {
  items: MenuItemProps[];
}

// Predefined menu items for common actions
export const ShareMenuItem: MenuItemProps = {
  icon: <Share2 className="w-4 h-4 mr-2" />,
  label: "Share",
};

export const ReportMenuItem: MenuItemProps = {
  icon: <Flag className="w-4 h-4 mr-2" />,
  label: "Report",
};

export const BlockMenuItem: MenuItemProps = {
  icon: <UserX className="w-4 h-4 mr-2" />,
  label: "Block User",
};

export const DeleteMenuItem: MenuItemProps = {
  icon: <Trash className="w-4 h-4 mr-2" />,
  label: "Delete",
  className: "text-destructive",
};

export const EditGroupMenuItem: MenuItemProps = {
  icon: <Settings className="w-4 h-4 mr-2" />,
  label: "Edit Group",
};

export default function ThreeDotsMenu({ items }: ThreeDotsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem 
            key={`menu-item-${index}`}
            onClick={item.onClick} 
            className={`cursor-pointer ${item.className || ""}`}
          >
            {item.icon} {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 