import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }) }));
import { EventForm } from '@/components/events/event-form';
const markup = () => renderToStaticMarkup(createElement(EventForm, { mode: 'create' }));
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const timeButtons = (html: string) => [...html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attr(tag,'role')==='combobox' && /^(Start|End) /.test(attr(tag,'aria-label') ?? ''));
describe('event form time control accessibility', () => {
  it.each(['Start hour','Start minute','Start AM/PM','End hour','End minute','End AM/PM'])('exposes a distinct %s control', (name) => {
    const buttons=timeButtons(markup());
    expect(buttons.filter(tag=>attr(tag,'aria-label')===name)).toHaveLength(1);
  });
  it('does not repeat the field ID across hour, minute and period controls', () => {
    const ids=timeButtons(markup()).map(tag=>attr(tag,'id'));
    expect(ids).toHaveLength(6);expect(ids.every(Boolean)).toBe(true);expect(new Set(ids).size).toBe(6);
  });
  it('associates the visible Start Time and End Time labels with their hour controls', () => {
    const html=markup();
    for(const stem of ['Start','End']) {
      const button=timeButtons(html).find(tag=>attr(tag,'aria-label')===`${stem} hour`)!;
      const label=new RegExp(`<label\\b[^>]*for="${attr(button,'id')}"[^>]*>${stem} Time</label>`);
      expect(html).toMatch(label);
    }
  });
});
