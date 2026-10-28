package com.mx.orderservice.event;

    public record OrderItemStockDto(

        Long productId,
        Integer quantity

    ) {}
