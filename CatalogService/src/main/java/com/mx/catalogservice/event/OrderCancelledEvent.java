package com.mx.catalogservice.event;

import java.util.List;

public record OrderCancelledEvent(

    String orderNumber,
    List<OrderItemStockDto> items


) {
}
