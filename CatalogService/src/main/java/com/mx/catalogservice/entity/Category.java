package com.mx.catalogservice.entity;

// Le decimos que es una Entidad.

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity

// Importamos Lombok

@Data
@NoArgsConstructor
@AllArgsConstructor


public class Category {

    // Este es su ID

    @Id
    private Long id;

    // Campos de la entidad

    private String name;

    private Boolean active;





}
