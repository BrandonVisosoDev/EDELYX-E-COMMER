package com.mx.orderservice.entity;

// Le decimos que es una entidad

import com.mx.orderservice.model.OrderStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")

// Importamos LOMBOK

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Order {

    // Asignamos su ID

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // Creamos los de mas campos de la entidad

    private String orderNumber;
    private String customerEmail;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;

    // Importamos el enum OrderStatus

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    // Agregamos la relacion con la entidad OrderItem

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();



}
