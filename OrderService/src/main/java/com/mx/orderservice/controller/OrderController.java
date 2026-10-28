package com.mx.orderservice.controller;

// Le decimos que es un controlador

import com.mx.orderservice.model.OrderRequest;
import com.mx.orderservice.model.OrderResponse;
import com.mx.orderservice.service.MetodosOrder;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController

// Le ponemos su ruta principal

@RequestMapping("/api/orders")

public class OrderController {

    // Inyectamos su constructor
    private final MetodosOrder service;

    public OrderController(MetodosOrder service) {
        this.service = service;
    }

    // POST -> REALIZAR COMPRA (201 CREATED)
    @PostMapping
    public ResponseEntity<OrderResponse> realizarCompra(@Valid @RequestBody OrderRequest request) {
        OrderResponse orderResponse = service.realizarCompra(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderResponse);
    }

    // GET -> OBTENER RECIBO POR FOLIO (200 OK)
    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponse> consultarPorFolio(@PathVariable String orderNumber) {
        return ResponseEntity.ok(service.consultarPorFolio(orderNumber));
    }

    // PATCH -> SI SE CANCELA SE DEVUELVE EL RESPONSE (200 OK)
    @PatchMapping("/{orderNumber}/cancel")
    public ResponseEntity<OrderResponse> cancelarOrden(@PathVariable String orderNumber) {
        return ResponseEntity.ok(service.cancelarOrden(orderNumber));
    }

}
