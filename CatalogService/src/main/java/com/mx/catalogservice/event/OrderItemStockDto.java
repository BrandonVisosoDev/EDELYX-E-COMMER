package com.mx.catalogservice.event;

    public record OrderItemStockDto(

        Long productId,
        Integer quantity

    ) {}
