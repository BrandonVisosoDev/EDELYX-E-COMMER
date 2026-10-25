package com.mx.orderservice.entity;

// Le decimos que es una entidad

import com.mx.orderservice.model.OrderStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity

// Importamos LOMBOK

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Order {

    // Asignamos su ID

    @Id
    private Long id;

    // Creamos los de mas campos de la entidad

    private String orderNumber;
    private String customerEmail;
    private BigDecimal totalAmount;
    private List<OrderItem> items;
    private LocalDateTime createdAt;

    // Importamos el enum OrderStatus

    @Enumerated(EnumType.STRING)
    private OrderStatus status;


}
