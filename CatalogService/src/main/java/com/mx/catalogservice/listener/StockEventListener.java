package com.mx.catalogservice.listener;

import com.mx.catalogservice.config.RabbitMQConfig;
import com.mx.catalogservice.event.OrderCancelledEvent;
import com.mx.catalogservice.event.OrderCreatedEvent;
import com.mx.catalogservice.service.MetodosProducts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component

public class StockEventListener {

    private final MetodosProducts productsService;
    public StockEventListener(MetodosProducts productsService) {
        this.productsService = productsService;
    }
    // 1. Escuchar la cola de descuento
    @RabbitListener(queues = RabbitMQConfig.QUEUE_STOCK_DISCOUNT)
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("RabbitMQ -> Recibida orden '{}'. Descontando stock de {} productos...",
            event.orderNumber(), event.items().size());
        productsService.descontarStock(event.items());
    }
    // 2. Escuchar la cola de reintegro
    @RabbitListener(queues = RabbitMQConfig.QUEUE_STOCK_RESTORE)
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("RabbitMQ -> Orden '{}' cancelada. Reintegrando stock de {} productos...",
            event.orderNumber(), event.items().size());
        productsService.reintegrarStock(event.items());
    }


}
