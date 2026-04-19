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
import type { ComponentType } from 'react';

interface StoryArgs {
  title: string;
  description: string;
  body: string;
  actionLabel: string;
}

const meta: Meta<StoryArgs> = {
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
