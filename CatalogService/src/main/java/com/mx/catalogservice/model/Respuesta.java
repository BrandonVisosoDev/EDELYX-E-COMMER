package com.mx.catalogservice.model;

// Importamos Lombok

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class Respuesta {

    private String mensaje;
    private boolean success;
    private Object obj;

}
