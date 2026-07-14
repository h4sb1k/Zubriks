# Graph Report - /home/invigar/IT/Development/Zubriks  (2026-07-14)

## Corpus Check
- 115 files · ~56,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 569 nodes · 1055 edges · 47 communities (38 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 100 input · 100 output

## Community Hubs (Navigation)
- Src Admin
- Backend Src
- Frontend Src
- Frontend Src
- Frontend Src
- Frontend Src
- Frontend Src
- Menubar Frontend
- Frontend Src
- Frontend Src
- Frontend Src
- Carousel Frontend
- Frontend Src
- Frontend Src
- Frontend Src
- App Frontend
- Frontend Src
- Frontend Src
- Frontend Src
- Drawer Frontend
- Select Frontend
- Sheet Frontend
- Frontend Src
- Frontend Src
- Frontend Src
- Pagination Frontend
- Frontend Src
- Toggle Frontend
- Frontend Src
- Achievementunlock Frontend
- Frontend Src
- Accordion Frontend
- Alert Frontend
- Popover Frontend
- Avatar Frontend
- Frontend Src
- Frontend Src
- Canvas Confetti
- React Dom
- Badge Frontend
- Canvas Confetti
- Frontend Src
- React Dom

## God Nodes (most connected - your core abstractions)
1. `cn()` - 223 edges
2. `DynamicIcon()` - 13 edges
3. `trpc` - 13 edges
4. `buttonVariants` - 9 edges
5. `openPointInMaps()` - 9 edges
6. `calculateDistance()` - 8 edges
7. `createContext()` - 8 edges
8. `trpc` - 8 edges
9. `RouteActive()` - 7 edges
10. `useOsrmRoute()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminScreen()` --indirect_call--> `Route`  [INFERRED]
  admin/src/components/AdminScreen.tsx → frontend/src/app/components/RoutesScreen.tsx
- `AccordionItem()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AccordionTrigger()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AccordionContent()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/alert-dialog.tsx → frontend/src/app/components/ui/utils.ts

## Import Cycles
- None detected.

## Communities (47 total, 9 thin omitted)

### Community 0 - "Src Admin"
Cohesion: 0.06
Nodes (32): App(), AchievementBuilder(), AchievementEditData, AdminScreen(), AdminTab, AlertModalProps, ConfirmModalProps, DynamicIcon() (+24 more)

### Community 1 - "Backend Src"
Cohesion: 0.07
Nodes (41): clearAdminAuthCookies(), clearAuthCookies(), COOKIE_OPTIONS_ADMIN, COOKIE_OPTIONS_BASE, generateAccessToken(), generateAdminAccessToken(), generateAdminRefreshToken(), generateRefreshToken() (+33 more)

### Community 2 - "Frontend Src"
Cohesion: 0.08
Nodes (33): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator(), Card(), CardAction() (+25 more)

### Community 3 - "Frontend Src"
Cohesion: 0.07
Nodes (35): Input(), Separator(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup() (+27 more)

### Community 4 - "Frontend Src"
Cohesion: 0.12
Nodes (14): Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut(), Dialog() (+6 more)

### Community 5 - "Frontend Src"
Cohesion: 0.15
Nodes (12): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+4 more)

### Community 6 - "Frontend Src"
Cohesion: 0.15
Nodes (6): AchievementData, AchievementModalProps, ConfirmModalProps, ImageWithFallback(), RouteInfo, RouteInfo

### Community 7 - "Menubar Frontend"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 8 - "Frontend Src"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 9 - "Frontend Src"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 10 - "Frontend Src"
Cohesion: 0.21
Nodes (7): DynamicIcon(), DynamicIconProps, AVAILABLE_ICONS, IconPicker(), IconPickerProps, customIcon, WaypointDraft

### Community 11 - "Carousel Frontend"
Cohesion: 0.20
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 12 - "Frontend Src"
Cohesion: 0.20
Nodes (11): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+3 more)

### Community 13 - "Frontend Src"
Cohesion: 0.24
Nodes (9): HomeScreen(), UserData, Zubrik, createUserLocationIcon(), createZubrikIcon(), MapScreen(), Zubrik, calculateDistance() (+1 more)

### Community 14 - "Frontend Src"
Cohesion: 0.21
Nodes (8): InteractiveMapModal(), InteractiveMapModalProps, Waypoint, RouteBuilder(), RoutePreviewMap(), RoutePreviewMapProps, Waypoint, useOsrmRoute()

### Community 15 - "App Frontend"
Cohesion: 0.25
Nodes (8): App(), MainApp(), tabs, TabType, NewAchievement, PointOfInterest, useProximityCheck(), TrpcProvider()

### Community 16 - "Frontend Src"
Cohesion: 0.27
Nodes (8): loginWithVK(), TODO: open authUrl in an in-app browser / WebView, capture the callback, loginWithYandex(), TODO: open authUrl in an in-app browser / WebView, capture the callback, FieldErrors, OnboardingScreen(), OnboardingScreenProps, usePersistedStep()

### Community 17 - "Frontend Src"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 18 - "Frontend Src"
Cohesion: 0.18
Nodes (5): Checkbox(), Progress(), Slider(), Switch(), Textarea()

### Community 19 - "Drawer Frontend"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 20 - "Select Frontend"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 21 - "Sheet Frontend"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 22 - "Frontend Src"
Cohesion: 0.36
Nodes (7): RFC-5870, RouteActive(), RouteActiveProps, MapPoint, openGeoUri(), openPointInMaps(), openRouteInMaps()

### Community 23 - "Frontend Src"
Cohesion: 0.22
Nodes (5): queryClient, RouterOutput, trpc, trpcClient, TrpcType

### Community 24 - "Frontend Src"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 25 - "Pagination Frontend"
Cohesion: 0.25
Nodes (6): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 26 - "Frontend Src"
Cohesion: 0.33
Nodes (4): categoryIcon, EventsScreen(), formatDate(), LoadingZubrikProps

### Community 27 - "Toggle Frontend"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 28 - "Frontend Src"
Cohesion: 0.38
Nodes (5): createZubrikIcon(), ZubrikDetail(), ZubrikDetailProps, Props, ZubrikImage()

### Community 29 - "Achievementunlock Frontend"
Cohesion: 0.47
Nodes (5): AchievementUnlock(), AchievementUnlockProps, CONFETTI_COLORS, fireCannon(), shootFromCard()

### Community 31 - "Accordion Frontend"
Cohesion: 0.40
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 32 - "Alert Frontend"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 34 - "Avatar Frontend"
Cohesion: 0.50
Nodes (3): Avatar(), AvatarFallback(), AvatarImage()

### Community 42 - "Frontend Src"
Cohesion: 0.67
Nodes (3): Orel City, Zubrik Mascot, Zubriki App

## Knowledge Gaps
- **97 isolated node(s):** `TabType`, `tabs`, `AchievementData`, `AchievementModalProps`, `AchievementUnlockProps` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Frontend Src` to `Frontend Src`, `Frontend Src`, `Frontend Src`, `Menubar Frontend`, `Frontend Src`, `Frontend Src`, `Carousel Frontend`, `Frontend Src`, `Frontend Src`, `Frontend Src`, `Drawer Frontend`, `Select Frontend`, `Sheet Frontend`, `Frontend Src`, `Pagination Frontend`, `Toggle Frontend`, `Accordion Frontend`, `Alert Frontend`, `Popover Frontend`, `Avatar Frontend`, `Frontend Src`, `Frontend Src`, `Badge Frontend`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `Route` connect `Src Admin` to `Frontend Src`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `TabType`, `tabs`, `AchievementData` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Src Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.05706214689265537 - nodes in this community are weakly interconnected._
- **Should `Backend Src` be split into smaller, more focused modules?**
  _Cohesion score 0.07020408163265306 - nodes in this community are weakly interconnected._
- **Should `Frontend Src` be split into smaller, more focused modules?**
  _Cohesion score 0.08478513356562137 - nodes in this community are weakly interconnected._
- **Should `Frontend Src` be split into smaller, more focused modules?**
  _Cohesion score 0.06585365853658537 - nodes in this community are weakly interconnected._