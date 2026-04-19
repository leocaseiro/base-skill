# Audit `src/components/ui/*` Stories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit the 10 `src/components/ui/*.stories.tsx` files to the Controls Policy and Required Variants gates introduced in PR #119.

**Architecture:** One commit per story file. Each task reads the component source, applies the seven audit-checklist gates from `.claude/skills/write-storybook/SKILL.md`, runs `yarn typecheck` and `yarn lint`, then commits. After all 10 tasks land, a single end-of-PR Storybook test-runner pass verifies the aggregate.

**Tech Stack:** Storybook 10.3.3 (`@storybook/react-vite`), `storybook/test` (exposes `userEvent`, `within`, `expect`, `fn`), `@storybook/addon-a11y` (global `a11y.test: 'error'`), `@storybook/addon-themes`, Radix primitives (portals to `document.body` for `alert-dialog`, `dropdown-menu`, `select`, `sheet`).

**Spec:** `docs/superpowers/specs/2026-04-17-audit-storybook-ui-controls-design.md` — read this first; the per-file audit table is authoritative.

---

## Shared Conventions (applies to every task)

- **Worktree:** all work happens in `worktrees/audit-storybook-controls/` on branch `audit/storybook-controls`. Never touch `master`.
- **Imports in `play()`:** `import { userEvent, within, expect } from 'storybook/test';` — the package is `storybook/test`, NOT `@storybook/test`.
- **Radix portal gotcha:** for `alert-dialog`, `dropdown-menu`, `select`, `sheet`, Radix renders open content into `document.body` via a portal. Queries scoped to `within(canvasElement)` will miss that content. Use `within(document.body)` (or `document.body.querySelector`) after opening the trigger. If a `play()` proves brittle (animation race, focus flicker, Radix API incompatibility), drop that specific `play()` story and document the reason in the commit body — the spec allows this.
- **No manual action wiring:** `.storybook/preview.tsx` sets `parameters.actions.argTypesRegex: '^on[A-Z].*'` globally. Remove any `onFoo: { action: '...' }` entries; never add them.
- **Controls map:** enum/union → `control: { type: 'select' }` + `options`; boolean → `control: 'boolean'`; bounded number → `control: { type: 'range', min, max, step }`; free text → `control: 'text'`. Callbacks and JSX get `control: false`.
- **Story names:** PascalCase, describe state: `TypesAndReflectsValue`, `OpensAndConfirms`, `CancelsWithEscape`. No `ButtonWithClickAndLabel`-style combinatorial names.
- **Don't touch** `parameters.a11y.config.rules` color-contrast opt-outs in `button.stories.tsx` (Secondary) or `input.stories.tsx` (Invalid). A future token-fix PR handles them.
- **Per-task verification (always run before committing):**
  - `yarn typecheck` → exit 0
  - `yarn lint` → exit 0
  - Do NOT run `yarn test:storybook` per task — too slow. End-of-PR task covers it.
- **Commit message shape:** `stories(ui/<name>): retrofit per controls policy` with a body listing which gates were applied (controls, action cleanup, `play()`, state variants). If a `play()` was dropped, explain why.

---

## Task 1: Retrofit `button.stories.tsx`

**Files:**

- Modify: `src/components/ui/button.stories.tsx`
- Read (for prop types): `src/components/ui/button.tsx`

**Gates to apply (from spec Per-file Audit row 1):**

- Controls: `variant` select, `size` select, `disabled` boolean.
- Action cleanup: remove the existing `onClick: { action: 'clicked' }` from meta.argTypes.
- `play()`: add `ClicksButton` exercising the primary flow.
- State variants: already covered (`Disabled` exists; all variants + sizes exist).

**Steps:**

- [ ] **Step 1: Read `button.tsx`** to confirm the exact `variant` and `size` union values.

Run: `cat src/components/ui/button.tsx`

- [ ] **Step 2: Replace `meta.argTypes`**

```tsx
const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'outline',
        'secondary',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
};
```

Adjust `options` arrays to match the actual union in `button.tsx` if they differ. Delete the `onClick: { action: 'clicked' }` entry entirely.

- [ ] **Step 3: Add `ClicksButton` interaction story at the end of the file**

```tsx
import { fn, userEvent, within, expect } from 'storybook/test';

export const ClicksButton: Story = {
  args: {
    children: 'Click me',
    variant: 'default',
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /click me/i }),
    );
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
```

- [ ] **Step 4: Run `yarn typecheck` — expect exit 0.**

- [ ] **Step 5: Run `yarn lint` — expect exit 0.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.stories.tsx
git commit -m "stories(ui/button): retrofit per controls policy"
```

---

## Task 2: Retrofit `input.stories.tsx`

**Files:**

- Modify: `src/components/ui/input.stories.tsx`
- Read: `src/components/ui/input.tsx`

**Gates:**

- Controls: `type` select, `disabled` boolean, `aria-invalid` boolean.
- `play()`: `TypesAndReflectsValue` (types into input, asserts value).
- State variants: add `Required`, `ReadOnly`.
- Leave the `Invalid` story's `a11y.config.rules` opt-out untouched.

**Steps:**

- [ ] **Step 1: Replace `meta` with proper `argTypes`**

```tsx
const meta: Meta<typeof Input> = {
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: [
        'text',
        'email',
        'password',
        'number',
        'search',
        'tel',
        'url',
      ],
    },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
};
```

- [ ] **Step 2: Add `TypesAndReflectsValue` interaction story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const TypesAndReflectsValue: Story = {
  args: { placeholder: 'Enter text…', 'aria-label': 'Example input' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Example input');
    await userEvent.type(input, 'hello');
    await expect(input).toHaveValue('hello');
  },
};
```

- [ ] **Step 3: Add `Required` and `ReadOnly` state stories**

```tsx
export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field',
    'aria-label': 'Required example',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: 'Read-only value',
    'aria-label': 'Read-only example',
  },
};
```

- [ ] **Step 4: `yarn typecheck` — exit 0.**

- [ ] **Step 5: `yarn lint` — exit 0.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/input.stories.tsx
git commit -m "stories(ui/input): retrofit per controls policy"
```

---

## Task 3: Retrofit `slider.stories.tsx`

**Files:**

- Modify: `src/components/ui/slider.stories.tsx`
- Read: `src/components/ui/slider.tsx`

**Gates:**

- Controls: `min` / `max` / `step` range, `disabled` boolean.
- `play()`: `KeyboardIncrement` — focus slider, press ArrowRight, assert value increments.
- State variants: add `Disabled`.

**Steps:**

- [ ] **Step 1: Replace `meta` with proper `argTypes`**

```tsx
const meta: Meta<typeof Slider> = {
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'range', min: 1, max: 200, step: 1 } },
    step: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    disabled: { control: 'boolean' },
  },
};
```

- [ ] **Step 2: Add `KeyboardIncrement` interaction story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const KeyboardIncrement: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Keyboard-driven slider',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(thumb).toHaveAttribute('aria-valuenow', '51');
  },
};
```

Note: Radix Slider sets `aria-valuenow` on the thumb. If the attribute proves flaky (e.g., Radix version differs), fall back to asserting focus + pressing the key, and note the limitation.

- [ ] **Step 3: Add `Disabled` story**

```tsx
export const Disabled: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Disabled slider',
    disabled: true,
  },
};
```

- [ ] **Step 4: `yarn typecheck` — exit 0.**

- [ ] **Step 5: `yarn lint` — exit 0.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/slider.stories.tsx
git commit -m "stories(ui/slider): retrofit per controls policy"
```

---

## Task 4: Retrofit `card.stories.tsx`

**Files:**

- Modify: `src/components/ui/card.stories.tsx`

**Gates:**

- Pure display — no interactive props, no `play()` required (spec Per-file row 4).
- Controls: expose text args for title / description so the Controls panel is useful.
- No state variants required.

**Steps:**

- [ ] **Step 1: Introduce a `StoryArgs` wrapper + render function** so title/description/body become individual controls.

Use the Complex Object Props pattern from SKILL.md lines 134–184. Example shape:

```tsx
import { type ComponentType } from 'react';
import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import type { Meta, StoryObj } from '@storybook/react';

interface StoryArgs {
  title: string;
  description: string;
  body: string;
  actionLabel: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/Card',
  component: Card as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    title: 'Card Title',
    description: 'Card description goes here.',
    body: 'Card body content.',
    actionLabel: 'Action',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    body: { control: 'text' },
    actionLabel: { control: 'text' },
  },
  render: ({ title, description, body, actionLabel }) => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">{actionLabel}</Button>
      </CardFooter>
    </Card>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const Small: Story = {
  render: ({ title, body }) => (
    <Card className="w-72" size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  ),
  args: { title: 'Small Card', body: 'Compact variant.' },
};
```

Adjust Card's `size` prop options if the component supports more than `sm`; add a `size` argType if so.

- [ ] **Step 2: `yarn typecheck` — exit 0.**

- [ ] **Step 3: `yarn lint` — exit 0.**

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.stories.tsx
git commit -m "stories(ui/card): retrofit per controls policy"
```

---

## Task 5: Retrofit `label.stories.tsx`

**Files:**

- Modify: `src/components/ui/label.stories.tsx`

**Gates:**

- Pure display — no `play()`, no state variants.
- Controls: `htmlFor`, `children` text.

**Steps:**

- [ ] **Step 1: Wrap in Complex Object Props pattern** — same double-cast approach as Card.

```tsx
import { type ComponentType } from 'react';
import { Input } from './input';
import { Label } from './label';
import type { Meta, StoryObj } from '@storybook/react';

interface StoryArgs {
  htmlFor: string;
  children: string;
  placeholder: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/Label',
  component: Label as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    htmlFor: 'name',
    children: 'Name',
    placeholder: 'Your name',
  },
  argTypes: {
    htmlFor: { control: 'text' },
    children: { control: 'text' },
    placeholder: { control: 'text' },
  },
  render: ({ htmlFor, children, placeholder }) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <Input id={htmlFor} placeholder={placeholder} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
```

- [ ] **Step 2: `yarn typecheck` — exit 0.**

- [ ] **Step 3: `yarn lint` — exit 0.**

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/label.stories.tsx
git commit -m "stories(ui/label): retrofit per controls policy"
```

**Review checkpoint after Task 5** — halfway trivia point per spec. If the implementer/reviewer loop is churning on repeat issues, pause and land a small SKILL.md patch before continuing.

---

## Task 6: Retrofit `alert-dialog.stories.tsx`

**Files:**

- Modify: `src/components/ui/alert-dialog.stories.tsx`
- Read: `src/components/ui/alert-dialog.tsx`

**Gates:**

- Controls: text args for trigger / title / description / confirm / cancel (Complex Object Props pattern).
- `play()`: `OpensAndConfirms`, `CancelsWithEscape`.
- State variants: add `Cancelled`.
- Portal: Radix renders content into `document.body` — use `within(document.body)` after opening.

**Steps:**

- [ ] **Step 1: Restructure meta with StoryArgs**

```tsx
interface StoryArgs {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/AlertDialog',
  component: AlertDialog as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Delete account',
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
  },
  render: ({
    triggerLabel,
    title,
    description,
    confirmLabel,
    cancelLabel,
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
```

- [ ] **Step 2: Add `OpensAndConfirms` play story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const OpensAndConfirms: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await expect(portal.getByRole('alertdialog')).toBeVisible();
    await userEvent.click(
      portal.getByRole('button', { name: /^delete$/i }),
    );
    await expect(portal.queryByRole('alertdialog')).toBeNull();
  },
};
```

- [ ] **Step 3: Add `CancelsWithEscape` play story**

```tsx
export const CancelsWithEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await expect(portal.getByRole('alertdialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(portal.queryByRole('alertdialog')).toBeNull();
  },
};
```

- [ ] **Step 4: Add `Cancelled` state story** — one that clicks Cancel via `play()`.

```tsx
export const Cancelled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /delete account/i }),
    );
    const portal = within(document.body);
    await userEvent.click(
      portal.getByRole('button', { name: /cancel/i }),
    );
    await expect(portal.queryByRole('alertdialog')).toBeNull();
  },
};
```

- [ ] **Step 5: `yarn typecheck` — exit 0.**

- [ ] **Step 6: `yarn lint` — exit 0.**

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/alert-dialog.stories.tsx
git commit -m "stories(ui/alert-dialog): retrofit per controls policy"
```

---

## Task 7: Retrofit `dropdown-menu.stories.tsx`

**Files:**

- Modify: `src/components/ui/dropdown-menu.stories.tsx`

**Gates:**

- Controls: text args for trigger + items.
- `play()`: `OpensAndSelects`.
- State variants: add `WithDestructiveItem`.
- Portal: `within(document.body)` after open.

**Steps:**

- [ ] **Step 1: Restructure meta with StoryArgs** exposing `triggerLabel`, `item1`, `item2`, `item3`.

```tsx
interface StoryArgs {
  triggerLabel: string;
  item1: string;
  item2: string;
  item3: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Options',
    item1: 'Profile',
    item2: 'Settings',
    item3: 'Logout',
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    item1: { control: 'text' },
    item2: { control: 'text' },
    item3: { control: 'text' },
  },
  render: ({ triggerLabel, item1, item2, item3 }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{item1}</DropdownMenuItem>
        <DropdownMenuItem>{item2}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{item3}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
```

- [ ] **Step 2: Add `OpensAndSelects` play story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const OpensAndSelects: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /options/i }),
    );
    const portal = within(document.body);
    await expect(portal.getByRole('menu')).toBeVisible();
    await userEvent.click(
      portal.getByRole('menuitem', { name: /profile/i }),
    );
    await expect(portal.queryByRole('menu')).toBeNull();
  },
};
```

- [ ] **Step 3: Add `WithDestructiveItem` story** — renders a destructive item.

```tsx
export const WithDestructiveItem: Story = {
  render: ({ triggerLabel, item1, item2 }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{item1}</DropdownMenuItem>
        <DropdownMenuItem>{item2}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  args: {
    triggerLabel: 'Account',
    item1: 'Profile',
    item2: 'Settings',
    item3: '',
  },
};
```

If `DropdownMenuItem` supports a `variant` or `destructive` prop, prefer that over a className hack — read `dropdown-menu.tsx` first.

- [ ] **Step 4: `yarn typecheck` — exit 0.**

- [ ] **Step 5: `yarn lint` — exit 0.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/dropdown-menu.stories.tsx
git commit -m "stories(ui/dropdown-menu): retrofit per controls policy"
```

---

## Task 8: Retrofit `select.stories.tsx`

**Files:**

- Modify: `src/components/ui/select.stories.tsx`

**Gates:**

- Controls: text args for trigger label, options (via multi-line `options` text or individual `optionN` args).
- `play()`: `SelectsOption`.
- State variants: keep the existing `WithPreselected` (rename to `Preselected` for convention) and add `Disabled`.
- Portal: `within(document.body)` for the open list.

**Steps:**

- [ ] **Step 1: Restructure meta**

```tsx
interface StoryArgs {
  triggerLabel: string;
  option1: string;
  option2: string;
  option3: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/Select',
  component: Select as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    triggerLabel: 'Select a fruit',
    option1: 'Apple',
    option2: 'Banana',
    option3: 'Orange',
  },
  argTypes: {
    triggerLabel: { control: 'text' },
    option1: { control: 'text' },
    option2: { control: 'text' },
    option3: { control: 'text' },
  },
  render: ({ triggerLabel, option1, option2, option3 }) => (
    <Select>
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
  ),
};
```

- [ ] **Step 2: Rename `WithPreselected` → `Preselected`** and keep its body (update `render` to use new shape).

- [ ] **Step 3: Add `Disabled` story** — wrap the Select with `disabled` on the trigger per the component's API.

- [ ] **Step 4: Add `SelectsOption` play story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const SelectsOption: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('combobox', { name: /select a fruit/i }),
    );
    const portal = within(document.body);
    await userEvent.click(
      portal.getByRole('option', { name: /banana/i }),
    );
    await expect(canvas.getByRole('combobox')).toHaveTextContent(
      /banana/i,
    );
  },
};
```

- [ ] **Step 5: `yarn typecheck` — exit 0.**

- [ ] **Step 6: `yarn lint` — exit 0.**

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/select.stories.tsx
git commit -m "stories(ui/select): retrofit per controls policy"
```

---

## Task 9: Retrofit `sheet.stories.tsx`

**Files:**

- Modify: `src/components/ui/sheet.stories.tsx`

**Gates:**

- Controls: `side` select (right / left / top / bottom), text args for title / description / body.
- `play()`: `OpensAndClosesOnEscape`.
- State variants: keep + expand to `FromTop`, `FromBottom` (in addition to existing `FromRight`, `FromLeft`).
- Portal: `within(document.body)`.

**Steps:**

- [ ] **Step 1: Restructure meta** — `side` goes into argTypes as a select.

```tsx
interface StoryArgs {
  side: 'right' | 'left' | 'top' | 'bottom';
  triggerLabel: string;
  title: string;
  description: string;
  body: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/Sheet',
  component: Sheet as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    side: 'right',
    triggerLabel: 'Open sheet',
    title: 'Sheet Title',
    description: 'Sheet description here.',
    body: 'Sheet body content.',
  },
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['right', 'left', 'top', 'bottom'],
    },
    triggerLabel: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    body: { control: 'text' },
  },
  render: ({ side, triggerLabel, title, description, body }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <p className="p-4 text-sm">{body}</p>
      </SheetContent>
    </Sheet>
  ),
};

export const Default: Story = {};
export const FromRight: Story = { args: { side: 'right' } };
export const FromLeft: Story = { args: { side: 'left' } };
export const FromTop: Story = { args: { side: 'top' } };
export const FromBottom: Story = { args: { side: 'bottom' } };
```

Remove old render-based `FromRight`/`FromLeft` stories.

- [ ] **Step 2: Add `OpensAndClosesOnEscape` play story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const OpensAndClosesOnEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /open sheet/i }),
    );
    const portal = within(document.body);
    await expect(portal.getByRole('dialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(portal.queryByRole('dialog')).toBeNull();
  },
};
```

- [ ] **Step 3: `yarn typecheck` — exit 0.**

- [ ] **Step 4: `yarn lint` — exit 0.**

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/sheet.stories.tsx
git commit -m "stories(ui/sheet): retrofit per controls policy"
```

---

## Task 10: Retrofit `sonner.stories.tsx`

**Files:**

- Modify: `src/components/ui/sonner.stories.tsx`

**Gates:**

- Controls: `variant` select (default / success / error), `message` text.
- `play()`: `ShowsToast` — click trigger, assert toast appears in portal.
- No additional state variants beyond the three variants.

**Steps:**

- [ ] **Step 1: Restructure meta**

```tsx
type ToastVariant = 'default' | 'success' | 'error';

interface StoryArgs {
  variant: ToastVariant;
  message: string;
  triggerLabel: string;
}

const meta: Meta<StoryArgs> = {
  title: 'UI/Sonner',
  component: Button as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: withToastUi,
  args: {
    variant: 'default',
    message: 'Event registered!',
    triggerLabel: 'Show toast',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'error'] satisfies ToastVariant[],
    },
    message: { control: 'text' },
    triggerLabel: { control: 'text' },
  },
  render: ({ variant, message, triggerLabel }) => {
    const fire = () => {
      if (variant === 'success') return toast.success(message);
      if (variant === 'error') return toast.error(message);
      return toast(message);
    };
    return <Button onClick={fire}>{triggerLabel}</Button>;
  },
};

export const Default: Story = { args: { variant: 'default' } };
export const Success: Story = {
  args: { variant: 'success', message: 'Saved successfully' },
};
export const Error: Story = {
  args: { variant: 'error', message: 'Something went wrong' },
};
```

- [ ] **Step 2: Add `ShowsToast` play story**

```tsx
import { userEvent, within, expect } from 'storybook/test';

export const ShowsToast: Story = {
  args: {
    variant: 'default',
    message: 'Event registered!',
    triggerLabel: 'Show toast',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /show toast/i }),
    );
    const portal = within(document.body);
    await expect(
      await portal.findByText(/event registered/i),
    ).toBeVisible();
  },
};
```

Sonner renders into `#_rht_toaster` (or similar) on `document.body`; `findByText` waits for it.

- [ ] **Step 3: `yarn typecheck` — exit 0.**

- [ ] **Step 4: `yarn lint` — exit 0.**

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/sonner.stories.tsx
git commit -m "stories(ui/sonner): retrofit per controls policy"
```

---

## Task 11: End-of-PR verification

**Goal:** Prove nothing regressed across the whole Storybook.

- [ ] **Step 1: Run full verification suite**

```bash
yarn typecheck
yarn lint
yarn lint:md
```

All three must exit 0.

- [ ] **Step 2: Start Storybook on a free port**

```bash
PORT=6006
while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
yarn storybook --port $PORT --ci &
STORYBOOK_PID=$!
until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
```

- [ ] **Step 3: Run the Storybook test-runner against that port**

```bash
yarn test:storybook --url http://127.0.0.1:$PORT
TEST_EXIT=$?
[ $TEST_EXIT -eq 0 ] && kill $STORYBOOK_PID
exit $TEST_EXIT
```

Expected: all stories (not just `ui/*`) pass a11y + `play()`. If a non-`ui/*` story fails, treat it as pre-existing and out of scope — log it in the PR description, don't fix it here (spec Risks row 3).

- [ ] **Step 4: Verify branch log**

```bash
git log --oneline origin/master..HEAD
```

Expected: 10 `stories(ui/*): ...` commits, plus the two pre-existing commits (`docs(spec)` and `chore(settings)`), plus any fix-up commits the review loop required.

- [ ] **Step 5: Open the PR** — title `stories(ui): audit retrofit per new controls policy`. Body must include:
  - Link to `.claude/skills/write-storybook/SKILL.md`
  - The _Per-file Audit_ table from the spec (reviewer orientation)
  - List of any `play()` stories that were dropped with reasons
  - List of any non-`ui/*` pre-existing failures surfaced by the test-runner

---

## Post-plan

After the PR merges:

- Remove the worktree: `git worktree remove worktrees/audit-storybook-controls`
- Track follow-ups:
  - Token-fix PR (contrast opt-outs in `button` Secondary and `input` Invalid)
  - Audit remaining 34 story files in `answer-game/`, `questions/`, `games/`, and component roots
