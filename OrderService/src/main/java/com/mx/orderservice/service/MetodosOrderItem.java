package com.mx.orderservice.service;

import com.mx.orderservice.entity.OrderItem;
import com.mx.orderservice.model.Respuesta;
import org.springframework.http.ResponseEntity;

public interface MetodosOrderItem {

    // CRUD DE ORDER ITEM

    // CREATE

    ResponseEntity<Respuesta> createOrderItem(OrderItem orderItem);

    // READ

    ResponseEntity<Respuesta> listOrderItems();

    // UPDATE

    ResponseEntity<Respuesta> updateOrderItem(OrderItem orderItem);

    // DELETE

    ResponseEntity<Respuesta> deleteOrderItemById(Long id);



}
