package com.mx.orderservice.entity;

// Le decimos que es una entidad

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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

    @Id
    private Long id;


    // Creamos los de mas campos de la entidad

    private Order   order;
    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;




}
