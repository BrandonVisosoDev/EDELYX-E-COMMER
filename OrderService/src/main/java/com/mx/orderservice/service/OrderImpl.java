package com.mx.orderservice.service;

import com.mx.orderservice.client.CatalogClient;
import com.mx.orderservice.config.RabbitMQConfig;
import com.mx.orderservice.entity.Order;
import com.mx.orderservice.entity.OrderItem;
import com.mx.orderservice.event.OrderCancelledEvent;
import com.mx.orderservice.event.OrderCreatedEvent;
import com.mx.orderservice.event.OrderItemStockDto;
import com.mx.orderservice.model.OrderItemRequest;
import com.mx.orderservice.model.OrderItemResponse;
import com.mx.orderservice.model.OrderRequest;
import com.mx.orderservice.model.OrderResponse;
import com.mx.orderservice.model.OrderStatus;
import com.mx.orderservice.model.ProductResponse;
import com.mx.orderservice.repository.OrderDao;


import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderImpl implements MetodosOrder {

    private final OrderDao orderDao;
    private final CatalogClient catalogClient;
    private final RabbitTemplate rabbitTemplate;

    public OrderImpl(OrderDao orderDao , CatalogClient catalogClient, RabbitTemplate rabbitTemplate) {
         this.orderDao = orderDao;
         this.catalogClient = catalogClient;
         this.rabbitTemplate = rabbitTemplate;
    }

    // 1. CASO DE USO: CHECKOUT (Crear la orden)
    @Override
    @Transactional
    public OrderResponse realizarCompra(OrderRequest request) {

        Order nuevaOrden = new Order();
        nuevaOrden.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        nuevaOrden.setCustomerEmail(request.getCustomerEmail());
        nuevaOrden.setStatus(OrderStatus.CREATED);
        nuevaOrden.setCreatedAt(LocalDateTime.now());

        BigDecimal granTotal = BigDecimal.ZERO;
        List<OrderItem> itemsAguardar = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {


            ProductResponse productoReal = catalogClient.getProductById(itemRequest.getProductId());

            if (productoReal.getStock() < itemRequest.getQuantity()) {
                throw new IllegalArgumentException("No hay stock suficiente para: " + productoReal.getName());
            }


            // Snapshot histórico: congelar nombre y precio real obtenidos de CatalogService
            OrderItem nuevoItem = new OrderItem();
            nuevoItem.setOrder(nuevaOrden);
            nuevoItem.setProductId(itemRequest.getProductId());
            nuevoItem.setProductName(productoReal.getName());
            nuevoItem.setUnitPrice(productoReal.getPrice());
            nuevoItem.setQuantity(itemRequest.getQuantity());

            itemsAguardar.add(nuevoItem);

            BigDecimal subTotal = nuevoItem.getUnitPrice().multiply(new BigDecimal(itemRequest.getQuantity()));
            granTotal = granTotal.add(subTotal);
        }

        nuevaOrden.setTotalAmount(granTotal);
        nuevaOrden.setItems(itemsAguardar); // IMPORTANTE: Vincular la lista de items a la orden

        Order ordenGuardada = orderDao.save(nuevaOrden);

        // Mapeamos los items al DTO del evento

        List<OrderItemStockDto> itemsEvent = ordenGuardada.getItems().stream()
            .map(item -> new OrderItemStockDto(item.getProductId(),
                item.getQuantity()))
            .toList();

        OrderCreatedEvent event = new OrderCreatedEvent(ordenGuardada.getOrderNumber(), itemsEvent);


        // Enviamos el mensaje a RabbitMQ

        rabbitTemplate.convertAndSend(

            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY_ORDER_CREATED,
            event


        );

        return mapToOrderResponse(ordenGuardada);
    }

    // 2. CASO DE USO: CONSULTAR EL RECIBO (Por Folio, no por ID interno)
    @Override
    @Transactional(readOnly = true) // Optimiza la consulta en Postgres porque no va a modificar datos
    public OrderResponse consultarPorFolio(String orderNumber) {

        Order ordenEncontrada = orderDao.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new IllegalArgumentException("No existe una orden con el folio: " + orderNumber));

        return mapToOrderResponse(ordenEncontrada);
    }

    // 3. CASO DE USO: CANCELAR ORDEN (El "Delete" lógico)
    @Override
    @Transactional
    public OrderResponse cancelarOrden(String orderNumber) {

        Order ordenExistente = orderDao.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new IllegalArgumentException("No existe una orden con el folio: " + orderNumber));

        // Regla de negocio: No puedes cancelar una orden que ya fue enviada o completada
        if(ordenExistente.getStatus() == OrderStatus.SHIPPED || ordenExistente.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("No se puede cancelar una orden que ya está en estado: " + ordenExistente.getStatus());
        }

        ordenExistente.setStatus(OrderStatus.CANCELLED);

        // (NOTA FUTURA: Si cancelas, aquí mandas un mensaje por RabbitMQ para que
        // el catalog-service le regrese el stock a los productos).

        Order ordenActualizada = orderDao.save(ordenExistente);

        List<OrderItemStockDto> itemsDevueltos = ordenActualizada.getItems().stream()
            .map(item -> new OrderItemStockDto (item.getProductId(),
                item.getQuantity())).toList();


        OrderCancelledEvent eventCancelacion = new OrderCancelledEvent(ordenActualizada.getOrderNumber(), itemsDevueltos);

        // ENVIAR MENSAJE AL RABBIT

        rabbitTemplate.convertAndSend(

            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY_ORDER_CANCELLED,
            eventCancelacion


        );


        return mapToOrderResponse(ordenActualizada);
    }

    // --- METODO AUXILIAR PRIVADO DE MAPEO ---
    private OrderResponse mapToOrderResponse(Order orden) {

        List<OrderItemResponse> itemResponses = orden.getItems().stream()
            .map(item -> OrderItemResponse.builder()
                .productId(item.getProductId())
                .productName(item.getProductName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subTotal(item.getUnitPrice().multiply(new BigDecimal(item.getQuantity())))
                .build())
            .toList();

        return OrderResponse.builder()
            .orderNumber(orden.getOrderNumber())
            .customerEmail(orden.getCustomerEmail())
            .totalAmount(orden.getTotalAmount())
            .status(orden.getStatus() != null ? orden.getStatus().name() : null)
            .createdAt(orden.getCreatedAt())
            .items(itemResponses)
            .build();
    }
}
