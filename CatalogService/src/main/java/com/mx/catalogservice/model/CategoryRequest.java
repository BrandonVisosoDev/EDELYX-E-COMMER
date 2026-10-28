package com.mx.catalogservice.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    // Validacion de campo Nombre de categoria

    @NotBlank(message = "El nombre de la categoria es obligatorio")
    private String name;


}
