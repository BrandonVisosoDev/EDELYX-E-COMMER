package com.mx.catalogservice.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data


public class ProductRequest {

    @NotBlank(message = "El SKU del producto es obligatorio")
    private String sku;

    @NotBlank(message = "El nombre del producto es obligatorio")
    private String name;

    private String description;

    @NotNull(message = "El precio del producto es obligatorio")
    @Min(value = 0, message = "El precio del producto debe ser mayor o igual a cero")
    private BigDecimal price;

    @NotBlank(message = "La URL de la imagen del producto es obligatoria")
    private String imageUrl;

    @NotNull(message = "El ID de la categoría es obligatorio")
    private Long categoryId;


}
