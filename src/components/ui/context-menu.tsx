import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] outline-none transition-colors data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:font-medium focus:bg-primary/15 focus:text-primary focus:font-medium data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary data-[highlighted]:font-medium hover:bg-primary/8 data-[highlighted]:hover:bg-primary/8 hover:text-primary data-[highlighted]:hover:text-primary [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground focus:[&>svg]:text-primary data-[highlighted]:[&>svg]:text-primary hover:[&>svg]:text-primary data-[highlighted]:hover:[&>svg]:text-primary hover:[&_svg]:text-primary data-[highlighted]:hover:[&_svg]:text-primary data-[state=open]:[&>svg]:text-primary",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[9rem] overflow-hidden rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[9rem] overflow-hidden rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-xl animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => {
  const isDestructive =
    variant === "destructive" ||
    (typeof className === "string" &&
      /\b(text-destructive|text-rose-\d+|text-red-\d+|text-danger)\b/.test(className));

  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      data-variant={isDestructive ? "destructive" : undefined}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isDestructive
          ? "text-destructive focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg]:text-destructive focus:[&>svg]:text-destructive data-[highlighted]:[&>svg]:text-destructive hover:[&>svg]:text-destructive hover:[&_svg]:text-destructive data-[highlighted]:hover:[&_svg]:text-destructive"
          : "focus:bg-primary/15 focus:text-primary focus:font-medium data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary data-[highlighted]:font-medium hover:bg-primary/8 data-[highlighted]:hover:bg-primary/8 hover:text-primary data-[highlighted]:hover:text-primary data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-[state=checked]:font-semibold data-[state=checked]:hover:bg-primary/18 data-[state=checked]:data-[highlighted]:bg-primary/18 [&>svg:not(.text-primary)]:text-muted-foreground focus:[&>svg]:text-primary data-[highlighted]:[&>svg]:text-primary hover:[&>svg]:text-primary data-[highlighted]:hover:[&>svg]:text-primary hover:[&_svg]:text-primary data-[highlighted]:hover:[&_svg]:text-primary data-[state=checked]:[&>svg]:text-primary [&.text-primary>svg]:text-primary [&.text-primary_svg]:text-primary",
        "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
});
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-[13px] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-primary/15 focus:text-primary focus:font-medium data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary hover:bg-primary/8 data-[highlighted]:hover:bg-primary/8 hover:text-primary data-[highlighted]:hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary data-[highlighted]:hover:[&>svg]:text-primary data-[highlighted]:hover:[&_svg]:text-primary data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-[state=checked]:font-semibold data-[state=checked]:hover:bg-primary/18 data-[state=checked]:data-[highlighted]:bg-primary/18",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center text-primary">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary stroke-[2.5]" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-[13px] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-primary/15 focus:text-primary focus:font-medium data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary hover:bg-primary/8 data-[highlighted]:hover:bg-primary/8 hover:text-primary data-[highlighted]:hover:text-primary hover:[&>svg]:text-primary hover:[&_svg]:text-primary data-[highlighted]:hover:[&>svg]:text-primary data-[highlighted]:hover:[&_svg]:text-primary data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-[state=checked]:font-semibold data-[state=checked]:hover:bg-primary/18 data-[state=checked]:data-[highlighted]:bg-primary/18",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider", inset && "pl-8", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border/60", className)} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-[11px] text-muted-foreground/80 shrink-0 pl-2", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
