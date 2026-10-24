package com.mx.orderservice.repository;

import com.mx.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderDao extends JpaRepository<Order, Long> {
    // Metodo para buscar una orden por su número de orden
    Optional<Order> findByOrderNumber(String orderNumber);
}
