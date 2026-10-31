import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import gsap from 'gsap';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { CreateOrderPayload } from '../../../models/order.model';
import { CartItem } from '../../../models/cart-item.model';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;

  readonly isSubmitting = signal<boolean>(false);
  readonly isRedirecting = signal<boolean>(false);
  readonly submitAttempted = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly mm = gsap.matchMedia();
  private reduceMotion = false;

  readonly checkoutForm = this.fb.nonNullable.group({
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  constructor() {
    this.mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        motion: '(prefers-reduced-motion: no-preference)',
      },
      (ctx) => {
        this.reduceMotion = Boolean(ctx.conditions?.['reduce']);
      },
    );
  }

  ngOnDestroy(): void {
    this.mm.revert();
  }

  get emailControl() {
    return this.checkoutForm.controls.customerEmail;
  }

  isEmailInvalid(): boolean {
    const ctrl = this.emailControl;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.submitAttempted());
  }

  getEmailErrorMessage(): string {
    const ctrl = this.emailControl;
    if (ctrl.hasError('required')) {
      return 'Ingresa un correo electrónico para emitir tu recibo digital.';
    }
    if (ctrl.hasError('email')) {
      return 'El formato del correo electrónico no es válido (ejemplo: cliente@dominio.com).';
    }
    if (ctrl.hasError('maxLength')) {
      return 'El correo no puede exceder 150 caracteres.';
    }
    return '';
  }

  openCartDrawer(): void {
    this.cartService.openDrawer();
  }

  onSubmit(event: Event): void {
    this.submitAttempted.set(true);
    this.errorMessage.set(null);

    if (this.isSubmitting()) {
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const currentItems = this.items();
    if (currentItems.length === 0) {
      this.errorMessage.set('Tu carrito está vacío. Agrega al menos un producto antes de confirmar.');
      return;
    }

    this.tactilePress(event);
    this.isSubmitting.set(true);

    const payload: CreateOrderPayload = {
      customerEmail: this.emailControl.value.trim(),
      items: currentItems.map((entry) => ({
        productId: entry.product.id,
        quantity: entry.quantity,
      })),
    };

    this.orderService.createOrder(payload).subscribe({
      next: (createdOrder) => {
        this.isRedirecting.set(true);
        this.cartService.clearCart();
        this.isSubmitting.set(false);
        this.router.navigate(['/orders', createdOrder.orderNumber]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(
            err,
            'No fue posible procesar tu orden en este momento. Verifica el stock e inténtalo de nuevo.',
          ),
        );
      },
    });
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

  private tactilePress(event: Event): void {
    if (this.reduceMotion) return;
    const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
    if (!submitter) return;

    gsap.fromTo(
      submitter,
      { scale: 0.97 },
      {
        scale: 1,
        duration: 0.22,
        ease: 'back.out(2)',
        overwrite: 'auto',
        clearProps: 'transform',
      },
    );
  }
}
