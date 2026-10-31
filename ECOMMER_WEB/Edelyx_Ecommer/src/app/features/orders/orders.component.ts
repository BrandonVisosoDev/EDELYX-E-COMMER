import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

export interface OrderStepItem {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly receiptRef = viewChild<ElementRef<HTMLElement>>('receiptCard');

  readonly order = signal<Order | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isCancelling = signal<boolean>(false);
  readonly confirmingCancel = signal<boolean>(false);
  readonly copiedFolio = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly searchForm = this.fb.nonNullable.group({
    orderNumber: ['', [Validators.required]],
  });

  readonly progressSteps: OrderStepItem[] = [
    { key: 'CREATED', label: 'Orden Creada', icon: 'pi-file-check' },
    { key: 'CONFIRMED', label: 'Confirmada', icon: 'pi-verified' },
    { key: 'SHIPPED', label: 'En Tránsito', icon: 'pi-truck' },
    { key: 'COMPLETED', label: 'Completada', icon: 'pi-check-circle' },
  ];

  // Botón "Cancelar Orden" activo únicamente si el estado es CREATED o CONFIRMED
  readonly canCancelOrder = computed(() => {
    const status = this.order()?.status;
    return status === 'CREATED' || status === 'CONFIRMED';
  });

  readonly totalUnits = computed(() => {
    const current = this.order();
    if (!current) return 0;
    return current.items.reduce((acc, item) => acc + item.quantity, 0);
  });

  private routeSub: Subscription | null = null;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly mm = gsap.matchMedia();
  private reduceMotion = false;

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

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const paramFolio = params.get('orderNumber');
      if (paramFolio && paramFolio.trim().length > 0) {
        const normalized = paramFolio.trim().toUpperCase();
        this.searchForm.controls.orderNumber.setValue(normalized, { emitEvent: false });
        this.fetchOrder(normalized);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
    this.mm.revert();
  }

  onSearchSubmit(): void {
    const rawValue = this.searchForm.controls.orderNumber.value.trim().toUpperCase();
    if (!rawValue) {
      this.errorMessage.set('Ingresa un número de folio válido (ejemplo: ORD-A1B2C3D4).');
      return;
    }

    this.searchForm.controls.orderNumber.setValue(rawValue, { emitEvent: false });
    const currentRouteFolio = this.route.snapshot.paramMap.get('orderNumber')?.trim().toUpperCase();

    if (currentRouteFolio === rawValue) {
      this.fetchOrder(rawValue);
    } else {
      this.router.navigate(['/orders', rawValue]);
    }
  }

  fetchOrder(orderNumber: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.feedbackMessage.set(null);
    this.confirmingCancel.set(false);

    this.orderService.getOrderByNumber(orderNumber).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
        this.animateReceiptEntrance();
      },
      error: (err) => {
        this.order.set(null);
        this.isLoading.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, `No se encontró ninguna orden con el folio "${orderNumber}".`),
        );
      },
    });
  }

  requestCancelConfirmation(): void {
    if (!this.canCancelOrder() || this.isCancelling()) return;
    this.confirmingCancel.set(true);
  }

  dismissCancelConfirmation(): void {
    this.confirmingCancel.set(false);
  }

  confirmCancelOrder(): void {
    const current = this.order();
    if (!current || !this.canCancelOrder() || this.isCancelling()) return;

    this.isCancelling.set(true);
    this.errorMessage.set(null);
    this.feedbackMessage.set(null);

    this.orderService.cancelOrder(current.orderNumber).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.isCancelling.set(false);
        this.confirmingCancel.set(false);
        this.feedbackMessage.set(
          `La orden ${updatedOrder.orderNumber} fue cancelada y se notificó el reintegro de stock al catálogo.`,
        );
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.confirmingCancel.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'No fue posible cancelar la orden solicitada.'),
        );
      },
    });
  }

  copyOrderNumber(orderNumber: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(orderNumber).then(() => {
        this.copiedFolio.set(true);
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => this.copiedFolio.set(false), 2000);
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'edelyx-order-badge edelyx-order-badge-created';
      case 'CONFIRMED':
      case 'PENDING':
        return 'edelyx-order-badge edelyx-order-badge-confirmed';
      case 'SHIPPED':
        return 'edelyx-order-badge edelyx-order-badge-shipped';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'edelyx-order-badge edelyx-order-badge-completed';
      case 'CANCELLED':
        return 'edelyx-order-badge edelyx-order-badge-cancelled';
      default:
        return 'edelyx-order-badge edelyx-order-badge-created';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'Creada';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'SHIPPED':
        return 'Enviada';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'pi-clock';
      case 'CONFIRMED':
      case 'PENDING':
        return 'pi-verified';
      case 'SHIPPED':
        return 'pi-truck';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'pi-check-circle';
      case 'CANCELLED':
        return 'pi-times-circle';
      default:
        return 'pi-info-circle';
    }
  }

  isStepActive(stepKey: string): boolean {
    const status = this.order()?.status;
    if (!status || status === 'CANCELLED') return false;
    if (status === 'PENDING' && stepKey === 'CONFIRMED') return true;
    if (status === 'DELIVERED' && stepKey === 'COMPLETED') return true;
    return status === stepKey;
  }

  isStepDone(stepKey: string): boolean {
    const status = this.order()?.status;
    if (!status || status === 'CANCELLED') return false;
    const rankMap: Record<string, number> = {
      CREATED: 0,
      PENDING: 1,
      CONFIRMED: 1,
      SHIPPED: 2,
      DELIVERED: 3,
      COMPLETED: 3,
    };
    const currentRank = rankMap[status] ?? 0;
    const stepRank = rankMap[stepKey] ?? 0;
    return stepRank < currentRank;
  }

  getCancelDisabledReason(status: string): string {
    if (status === 'CANCELLED') {
      return 'Esta orden ya se encuentra cancelada y sus unidades fueron devueltas al inventario.';
    }
    if (status === 'SHIPPED' || status === 'COMPLETED' || status === 'DELIVERED') {
      return 'Las órdenes enviadas o completadas no admiten cancelación.';
    }
    return 'Solo las órdenes en estado Creada o Confirmada pueden cancelarse.';
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '—';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  formatAmount(value: number): string {
    return (value ?? 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private animateReceiptEntrance(): void {
    if (this.reduceMotion) return;
    requestAnimationFrame(() => {
      const card = this.receiptRef()?.nativeElement;
      if (!card) return;
      gsap.fromTo(
        card,
        { y: 16, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.34,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        },
      );
    });
  }
}
