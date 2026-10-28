package com.mx.orderservice.service;

import com.mx.orderservice.client.CatalogClient;
import com.mx.orderservice.config.RabbitMQConfig;
import com.mx.orderservice.entity.Order;
import com.mx.orderservice.entity.OrderItem;
import com.mx.orderservice.event.OrderCancelledEvent;
import com.mx.orderservice.event.OrderCreatedEvent;
import com.mx.orderservice.model.OrderItemRequest;
import com.mx.orderservice.model.OrderRequest;
import com.mx.orderservice.model.OrderResponse;
import com.mx.orderservice.model.OrderStatus;
import com.mx.orderservice.model.ProductResponse;
import com.mx.orderservice.repository.OrderDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Activamos Mockito

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas unitarias del Service Order")

class OrderImplTest {

    // Ponemos un Mock de Order

    @Mock
    private OrderDao orderDao;

    // Ponemos un Mock de OpenFeign

    @Mock
    private CatalogClient catalogClient;

    // Ponemos un Mock de RabbitMQ

    @Mock
    private RabbitTemplate rabbitTemplate;


    // Inyectamos el Mock del Servicio Real

    @InjectMocks
    private OrderImpl orderImpl;

    // Objetos de prueba que reutilizaremos en los métodos @Test
    private OrderRequest orderRequest;
    private ProductResponse productResponse;

    // Preparamos el entorno de purebas

    @BeforeEach
    void setUp(){

        // 1. Preparamos un producto ficticio simulado como si viniera del catálogo

        productResponse = new ProductResponse();
        productResponse.setId(1L);
        productResponse.setName("Laptop Lenovo ThinkPad T14");
        productResponse.setPrice(new BigDecimal("15000.00"));
        productResponse.setStock(10);


        // 2. Preparamos una solicitud de compra de ejemplo

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(1L);
        item.setQuantity(2);

        orderRequest = new OrderRequest();
        orderRequest.setCustomerEmail("cliente@correo.com");
        orderRequest.setItems(List.of(item));

    }

    // === PRUEBA 1: CREAR UNA ORDEN EXITOSA ===
    @Test
    @DisplayName("Crear una orden exitosa: calcula total, hace snapshot y publica en RabbitMQ")
    void crearUnaOrden_Exitosa() {
        // 1. ARRANGE
        when(catalogClient.getProductById(1L)).thenReturn(productResponse);
        when(orderDao.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 2. ACT
        OrderResponse respuesta = orderImpl.realizarCompra(orderRequest);

        // 3. ASSERT
        assertNotNull(respuesta);
        assertNotNull(respuesta.getOrderNumber());
        assertEquals("cliente@correo.com", respuesta.getCustomerEmail());
        assertEquals(OrderStatus.CREATED.name(), respuesta.getStatus());

        // Regla matemática: 2 laptops de 15,000 = 30,000.00
        assertEquals(new BigDecimal("30000.00"), respuesta.getTotalAmount());

        // Snapshot histórico del item
        assertEquals(1, respuesta.getItems().size());
        assertEquals("Laptop Lenovo ThinkPad T14", respuesta.getItems().get(0).getProductName());
        assertEquals(new BigDecimal("15000.00"), respuesta.getItems().get(0).getUnitPrice());

        // Verificaciones de invocación
        verify(orderDao, times(1)).save(any(Order.class));
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ORDER_CREATED),
                any(OrderCreatedEvent.class)
        );
    }

    // === PRUEBA 2: RECHAZAR ORDEN POR STOCK INSUFICIENTE ===
    @Test
    @DisplayName("Crear orden con stock insuficiente: debe lanzar IllegalArgumentException y no guardar nada")
    void crearUnaOrden_StockInsuficiente_LanzaExcepcion() {
        // 1. ARRANGE: El cliente pide 2, pero en catálogo solo queda 1
        productResponse.setStock(1);
        when(catalogClient.getProductById(1L)).thenReturn(productResponse);

        // 2. ACT & ASSERT
        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            orderImpl.realizarCompra(orderRequest);
        });

        assertTrue(excepcion.getMessage().contains("No hay stock suficiente"));

        // Seguridad: Nunca debió persistirse en BD ni notificarse a RabbitMQ
        verify(orderDao, never()).save(any(Order.class));
        verify(rabbitTemplate, never()).convertAndSend(any(), any(), any(Object.class));
    }

    // === PRUEBA 3: CONSULTAR ORDEN POR FOLIO EXITOSA ===
    @Test
    @DisplayName("Consultar por folio existente: debe retornar la orden con sus items mapeados")
    void consultarPorFolio_Exitosa() {
        // 1. ARRANGE
        Order ordenMock = crearOrdenMock("ORD-12345678", OrderStatus.CREATED);
        when(orderDao.findByOrderNumber("ORD-12345678")).thenReturn(Optional.of(ordenMock));

        // 2. ACT
        OrderResponse respuesta = orderImpl.consultarPorFolio("ORD-12345678");

        // 3. ASSERT
        assertNotNull(respuesta);
        assertEquals("ORD-12345678", respuesta.getOrderNumber());
        assertEquals("cliente@correo.com", respuesta.getCustomerEmail());
        assertEquals(OrderStatus.CREATED.name(), respuesta.getStatus());
        assertEquals(1, respuesta.getItems().size());
    }

    // === PRUEBA 4: CONSULTAR POR FOLIO INEXISTENTE ===
    @Test
    @DisplayName("Consultar por folio inexistente: debe lanzar IllegalArgumentException")
    void consultarPorFolio_NoExiste_LanzaExcepcion() {
        // 1. ARRANGE
        when(orderDao.findByOrderNumber("ORD-INEXISTENTE")).thenReturn(Optional.empty());

        // 2. ACT & ASSERT
        IllegalArgumentException excepcion = assertThrows(IllegalArgumentException.class, () -> {
            orderImpl.consultarPorFolio("ORD-INEXISTENTE");
        });

        assertTrue(excepcion.getMessage().contains("No existe una orden con el folio"));
    }

    // === PRUEBA 5: CANCELAR ORDEN EXITOSA ===
    @Test
    @DisplayName("Cancelar orden en estado CREATED: debe cambiar a CANCELLED y emitir evento de restitución")
    void cancelarOrden_Exitosa() {
        // 1. ARRANGE
        Order ordenMock = crearOrdenMock("ORD-12345678", OrderStatus.CREATED);
        when(orderDao.findByOrderNumber("ORD-12345678")).thenReturn(Optional.of(ordenMock));
        when(orderDao.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        // 2. ACT
        OrderResponse respuesta = orderImpl.cancelarOrden("ORD-12345678");

        // 3. ASSERT
        assertNotNull(respuesta);
        assertEquals(OrderStatus.CANCELLED.name(), respuesta.getStatus());

        // Verificamos guardado y publicación a RabbitMQ del evento OrderCancelledEvent
        verify(orderDao, times(1)).save(ordenMock);
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ORDER_CANCELLED),
                any(OrderCancelledEvent.class)
        );
    }

    // === PRUEBA 6: RECHAZAR CANCELACIÓN DE ORDEN YA ENVIADA O COMPLETADA ===
    @Test
    @DisplayName("Cancelar orden en estado SHIPPED: debe lanzar IllegalStateException")
    void cancelarOrden_EstadoInvalido_LanzaExcepcion() {
        // 1. ARRANGE: Orden que ya fue enviada
        Order ordenEnviada = crearOrdenMock("ORD-88888888", OrderStatus.SHIPPED);
        when(orderDao.findByOrderNumber("ORD-88888888")).thenReturn(Optional.of(ordenEnviada));

        // 2. ACT & ASSERT
        IllegalStateException excepcion = assertThrows(IllegalStateException.class, () -> {
            orderImpl.cancelarOrden("ORD-88888888");
        });

        assertTrue(excepcion.getMessage().contains("No se puede cancelar una orden que ya está en estado"));

        // Seguridad: El estado no cambió, no se guardó en BD ni se publicó en RabbitMQ
        assertEquals(OrderStatus.SHIPPED, ordenEnviada.getStatus());
        verify(orderDao, never()).save(any(Order.class));
        verify(rabbitTemplate, never()).convertAndSend(any(), any(), any(Object.class));
    }

    // --- Helper auxiliar para construir órdenes mock ---
    private Order crearOrdenMock(String orderNumber, OrderStatus status) {
        Order orden = new Order();
        orden.setId(10L);
        orden.setOrderNumber(orderNumber);
        orden.setCustomerEmail("cliente@correo.com");
        orden.setStatus(status);
        orden.setTotalAmount(new BigDecimal("30000.00"));
        orden.setCreatedAt(java.time.LocalDateTime.now());

        OrderItem item = new OrderItem();
        item.setId(100L);
        item.setOrder(orden);
        item.setProductId(1L);
        item.setProductName("Laptop Lenovo ThinkPad T14");
        item.setUnitPrice(new BigDecimal("15000.00"));
        item.setQuantity(2);

        orden.setItems(List.of(item));
        return orden;
    }
}
