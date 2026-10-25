package com.mx.catalogservice.entity;


// Le decimos que es una Entidad.

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity

// Importamos Lombok

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Products {

    // Este es su ID

    @Id
    private Long id;

    // Campos de la entidad

    private String sku;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private Boolean active;
    private Category category;
    private LocalDateTime createdAt;


}
