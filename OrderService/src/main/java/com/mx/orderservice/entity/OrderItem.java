package com.mx.orderservice.entity;

// Le decimos que es una entidad

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity

// Agregamos Lombok

@Data
@NoArgsConstructor
@AllArgsConstructor


public class OrderItem {

    // Asignamos su ID

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;


    // Creamos los de mas campos de la entidad

    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;

    // Agregamos la relacion

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;





}
