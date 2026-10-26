package com.mx.orderservice.model;

// Le ponemos el Lombok

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor

// Esto viene del FEIGN (client)


public class ProductResponse {

    private Long id;
    private String name;
    private BigDecimal price;
    private Integer stock;

}
