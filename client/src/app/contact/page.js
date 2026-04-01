'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Globe, Headphones, Mail, MessageSquareText, Phone, ShieldCheck } from 'lucide-react';
import { BrandWordmark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const contactOptions = [
  {
    title: 'Sales',
    description: 'Pricing, onboarding, integrations, and deployment planning.',
    href: 'mailto:sales@webitof.com',
    label: 'sales@webitof.com',
    icon: Mail,
  },
  {
    title: 'Website',
    description: 'Explore Webitof and the SilkPay product stack.',
    href: 'https://webitof.com',
    label: 'webitof.com',
    icon: Globe,
  },
  {
    title: 'Support',
    description: 'Need help after go-live? Reach the support team directly.',
    href: 'mailto:support@webitof.com',
    label: 'support@webitof.com',
    icon: Headphones,
  },
];

function ContactTile({ title, description, href, label, icon: Icon }) {
  const actionLabel = href.startsWith('mailto:') ? `Email ${title}` : `Open ${title}`;
  const external = href.startsWith('http');

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="break-all text-sm font-medium text-white">{label}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0e12] px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(108,93,211,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(34,197,94,0.08),_transparent_35%)]" />
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandWordmark iconClassName="h-9 w-9" textClassName="text-xl sm:text-2xl" />
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/25">
            <CardHeader className="space-y-4 pb-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <MessageSquareText className="h-3.5 w-3.5" />
                Contact Sales
              </div>
              <CardTitle className="text-3xl sm:text-4xl">Need a walkthrough, pricing, or onboarding help?</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Webitof can help you deploy SilkPay, tailor the integration flow, and align the platform with your payout operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Best for</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Deployment and rollout planning</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Integration and API questions</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Pricing and enterprise support</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Response flow</p>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>1. Send a message or open the website</li>
                  <li>2. Share your current use case and timeline</li>
                  <li>3. We reply with the next steps</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Direct line can be added here if your team has one
              </div>
              <Button asChild>
                <a href="mailto:sales@webitof.com">
                  <Mail className="h-4 w-4" />
                  Email Sales
                </a>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4">
            {contactOptions.map((item) => (
              <ContactTile key={item.title} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
