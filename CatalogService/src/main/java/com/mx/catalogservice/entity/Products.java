package com.mx.catalogservice.entity;


// Le decimos que es una Entidad.

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")

// Importamos Lombok

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Products {

    // Este es su ID

    // Le decimos que se autogenerara el ID y que es la llave primaria

    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    private LocalDateTime createdAt;

    // Relacion con la entidad Category

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;




}
