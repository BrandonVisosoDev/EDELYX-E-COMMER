package com.mx.orderservice.service;

import com.mx.orderservice.entity.Order;
import com.mx.orderservice.model.Respuesta;
import org.springframework.http.ResponseEntity;

public interface MetodosOrder {

    // Metodos CRUD DE ORDER

    // CREATE

    ResponseEntity<Respuesta> createOrder(Order order);

    // READ

    ResponseEntity<Respuesta> listOrders();

    // UPDATE

    ResponseEntity<Respuesta> updateOrder(Order order);

    // DELETE

    ResponseEntity<Respuesta> deleteOrderById(Long id);







}
