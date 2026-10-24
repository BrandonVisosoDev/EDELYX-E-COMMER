package com.mx.orderservice.service;

import com.mx.orderservice.entity.Order;
import com.mx.orderservice.model.OrderRequest;
import com.mx.orderservice.model.OrderResponse;
import org.springframework.http.ResponseEntity;

public interface MetodosOrder {

  // Metodos De Order

  // CASO 1: ANGULAR ENVIA EL CARRITO Y SE GENERA LA ORDEN

  OrderResponse realizarCompra(OrderRequest request);

  // CASO 2: ANGULAR PIDE VER EL RECIBO DE COMPRA MEDIANTE FOLIO

  OrderResponse consultarPorFolio(String orderNumber);

  // CASO 3: UN ADMIN O PROCESO CANCELA LA COMPRA
  // SE DEVUELVE EL RESPONSE ACTUALIZADO PARA QUE ANGULAR VEA EL STATUS

  OrderResponse cancelarOrden(String orderNumber);









}
