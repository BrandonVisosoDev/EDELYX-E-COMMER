package com.mx.orderservice.repository;

import com.mx.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDao extends JpaRepository<Order, Long> {
}
