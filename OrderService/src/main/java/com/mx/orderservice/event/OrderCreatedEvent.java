package com.mx.orderservice.event;

import java.util.List;

public record OrderCreatedEvent(

    String orderNumber,
    List<OrderItemStockDto> items


) {
}
