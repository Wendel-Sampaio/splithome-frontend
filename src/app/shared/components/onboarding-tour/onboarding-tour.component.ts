import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT, NgStyle } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, signal, ViewChild } from '@angular/core';
import { OnboardingTourService } from '../../../core/onboarding/onboarding-tour.service';
import { PlanService } from '../../../core/plan/plan.service';

type Rect = { left: number; top: number; width: number; height: number };

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [A11yModule, NgStyle],
  templateUrl: './onboarding-tour.component.html',
  styleUrl: './onboarding-tour.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingTourComponent implements AfterViewInit {
  readonly tour = inject(OnboardingTourService);
  readonly plan = inject(PlanService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('panel', { static: true }) private panel!: ElementRef<HTMLElement>;
  @ViewChild('heading', { static: true }) private heading!: ElementRef<HTMLElement>;
  readonly highlight = signal<Rect | null>(null);
  readonly position = signal({ left: '12px', top: '12px' });
  readonly ready = signal(false);
  private frame = 0;
  private target: HTMLElement | null = null;
  private readonly previousFocus = this.document.activeElement;
  private readonly previousScroll = { x: window.scrollX, y: window.scrollY };

  constructor() {
    effect(() => {
      const anchor = this.tour.step().anchor;
      this.target = anchor ? this.document.querySelector<HTMLElement>(`[data-tour-id="${anchor}"]`) : null;
      this.target?.scrollIntoView({
        block: window.matchMedia('(max-width: 760px)').matches ? 'start' : 'center',
        inline: 'nearest', behavior: 'instant'
      });
      this.schedulePosition();
      // Focus the new title so keyboard/screen-reader users hear each step.
      this.heading?.nativeElement.focus({ preventScroll: true });
    });
  }

  ngAfterViewInit(): void {
    const reposition = () => this.schedulePosition();
    const observer = new ResizeObserver(reposition);
    observer.observe(this.panel.nativeElement);
    window.addEventListener('resize', reposition);
    this.document.addEventListener('scroll', reposition, true);
    window.visualViewport?.addEventListener('resize', reposition);
    this.schedulePosition();
    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frame);
      observer.disconnect();
      window.removeEventListener('resize', reposition);
      this.document.removeEventListener('scroll', reposition, true);
      window.visualViewport?.removeEventListener('resize', reposition);
      window.scrollTo(this.previousScroll.x, this.previousScroll.y);
      // Restore after Home removes inert; do not steal focus from an opened upgrade dialog.
      queueMicrotask(() => {
        if (this.document.querySelector('.cdk-overlay-container [role="dialog"]')) return;
        const fallback = this.document.querySelector<HTMLElement>('[data-tour-id="menu-inicio"]');
        const previous = this.previousFocus instanceof HTMLElement && this.previousFocus !== this.document.body
          && this.previousFocus.isConnected ? this.previousFocus : fallback;
        previous?.focus({ preventScroll: true });
      });
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.tour.dismiss();
    }
  }

  private schedulePosition(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.updatePosition());
  }

  private updatePosition(): void {
    const margin = 12;
    const gap = 16;
    const width = this.document.documentElement.clientWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;
    const panel = this.panel.nativeElement.getBoundingClientRect();
    const clamp = (value: number, max: number) => Math.max(margin, Math.min(value, max));
    let left = (width - panel.width) / 2;
    let top = (height - panel.height) / 2;
    let rect: Rect | null = null;
    const target = this.target?.getBoundingClientRect();
    if (target && target.width && target.height) {
      const x = Math.max(4, target.left - 4);
      const y = Math.max(4, target.top - 4);
      rect = { left: x, top: y, width: Math.max(0, Math.min(width - 4, target.right + 4) - x),
        height: Math.max(0, Math.min(height - 4, target.bottom + 4) - y) };
      if (x + rect.width + gap + panel.width <= width - margin) {
        left = x + rect.width + gap;
        top = clamp(y, height - panel.height - margin);
      } else if (x - gap - panel.width >= margin) {
        left = x - gap - panel.width;
        top = clamp(y, height - panel.height - margin);
      } else if (y + rect.height + gap + panel.height <= height - margin) {
        top = y + rect.height + gap;
      } else if (y - gap - panel.height >= margin) {
        top = y - gap - panel.height;
      } else {
        // Large anchors (the whole mobile sidebar) get a visible spotlight above the card.
        top = height - panel.height - margin;
        rect.height = Math.max(0, Math.min(rect.height, top - gap - y));
      }
      if (!rect.width || !rect.height) rect = null;
    }
    this.highlight.set(rect);
    this.position.set({ left: `${clamp(left, width - panel.width - margin)}px`, top: `${clamp(top, height - panel.height - margin)}px` });
    this.ready.set(true);
  }
}
