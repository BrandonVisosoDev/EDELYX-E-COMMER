import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models/cart-item.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.component.html',
})
export class CartDrawerComponent implements AfterViewInit, OnDestroy {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly backdropRef = viewChild<ElementRef<HTMLElement>>('drawerBackdrop');
  readonly panelRef = viewChild<ElementRef<HTMLElement>>('drawerPanel');

  readonly items = this.cartService.items;
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;
  readonly stockNotice = this.cartService.stockNotice;

  // Mantiene el contenedor activo mientras se reproduce el timeline de salida
  readonly isRendered = signal<boolean>(false);

  private activeTimeline: gsap.core.Timeline | null = null;
  private readonly mm = gsap.matchMedia();
  private reduceMotion = false;
  private viewReady = false;

  constructor() {
    this.mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        motion: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        this.reduceMotion = Boolean(context.conditions?.['reduce']);
      },
    );

    effect(() => {
      const open = this.cartService.isDrawerOpen();
      untracked(() => {
        if (!this.viewReady) return;
        if (open) {
          this.animateOpen();
        } else if (this.isRendered()) {
          this.animateClose();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const backdrop = this.backdropRef()?.nativeElement;
    const panel = this.panelRef()?.nativeElement;

    if (backdrop && panel) {
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(panel, { xPercent: 100 });
    }

    if (this.cartService.isDrawerOpen()) {
      this.animateOpen();
    }
  }

  ngOnDestroy(): void {
    this.activeTimeline?.kill();
    this.mm.revert();
    this.restoreBodyScroll();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.cartService.isDrawerOpen()) {
      this.cartService.closeDrawer();
    }
  }

  closeDrawer(): void {
    this.cartService.closeDrawer();
  }

  incrementQuantity(item: CartItem, event: Event): void {
    this.tactilePress(event);
    this.cartService.updateQuantity(item.product.id, 1);
  }

  decrementQuantity(item: CartItem, event: Event): void {
    this.tactilePress(event);
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product.id, -1);
    }
  }

  removeItem(productId: number, event: Event): void {
    this.tactilePress(event);
    this.cartService.removeItem(productId);
  }

  clearCart(event: Event): void {
    this.tactilePress(event);
    this.cartService.clearCart();
  }

  proceedToCheckout(event: Event): void {
    this.tactilePress(event);
    this.cartService.closeDrawer();
    this.router.navigate(['/checkout']);
  }

  exploreCatalog(event: Event): void {
    this.tactilePress(event);
    this.cartService.closeDrawer();
    this.router.navigate(['/']);
  }

  getItemSubtotal(item: CartItem): number {
    return Math.round(item.product.price * item.quantity * 100) / 100;
  }

  formatAmount(value: number): string {
    return (value ?? 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  getPriceInteger(price: number): string {
    const [intPart] = (price ?? 0).toFixed(2).split('.');
    return Number(intPart).toLocaleString('es-MX');
  }

  getPriceCents(price: number): string {
    const [, decPart = '00'] = (price ?? 0).toFixed(2).split('.');
    return decPart;
  }

  private animateOpen(): void {
    const backdrop = this.backdropRef()?.nativeElement;
    const panel = this.panelRef()?.nativeElement;
    if (!backdrop || !panel) return;

    this.isRendered.set(true);
    this.lockBodyScroll();
    this.activeTimeline?.kill();

    if (this.reduceMotion) {
      gsap.set(backdrop, { autoAlpha: 1 });
      gsap.set(panel, { xPercent: 0 });
      return;
    }

    requestAnimationFrame(() => {
      const animatedNodes = panel.querySelectorAll('.edelyx-drawer-item, .edelyx-drawer-empty');
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      tl.addLabel('open', 0)
        .to(backdrop, { autoAlpha: 1, duration: 0.26 }, 'open')
        .to(panel, { xPercent: 0, duration: 0.36 }, 'open');

      if (animatedNodes.length > 0) {
        tl.fromTo(
          animatedNodes,
          { y: 14, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.24,
            stagger: 0.04,
            clearProps: 'transform,opacity,visibility',
          },
          '<0.08',
        );
      }

      this.activeTimeline = tl;
    });
  }

  private animateClose(): void {
    const backdrop = this.backdropRef()?.nativeElement;
    const panel = this.panelRef()?.nativeElement;
    this.restoreBodyScroll();

    if (!backdrop || !panel) {
      this.isRendered.set(false);
      return;
    }

    this.activeTimeline?.kill();

    if (this.reduceMotion) {
      gsap.set(panel, { xPercent: 100 });
      gsap.set(backdrop, { autoAlpha: 0 });
      this.isRendered.set(false);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        this.isRendered.set(false);
      },
    });

    tl.addLabel('close', 0)
      .to(panel, { xPercent: 100, duration: 0.26 }, 'close')
      .to(backdrop, { autoAlpha: 0, duration: 0.22 }, '<0.03');

    this.activeTimeline = tl;
  }

  private tactilePress(event: Event): void {
    if (this.reduceMotion) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;

    gsap.fromTo(
      target,
      { scale: 0.94 },
      {
        scale: 1,
        duration: 0.22,
        ease: 'back.out(2.2)',
        overwrite: 'auto',
        clearProps: 'transform',
      },
    );
  }

  private lockBodyScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  private restoreBodyScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
