package com.mx.catalogservice.entity;

// Le decimos que es una Entidad.

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Generated;
import lombok.NoArgsConstructor;

@Entity

// Importamos Lombok

@Data
@NoArgsConstructor
@AllArgsConstructor


public class Category {

    // Este es su ID
    // Le decimos que es la llave primaria y se autogenerara el ID

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // Campos de la entidad

    private String name;

    private Boolean active;







}
