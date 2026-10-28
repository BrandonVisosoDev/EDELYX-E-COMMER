package com.mx.orderservice.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data

public class OrderRequest {

    @NotBlank(message = "El Email del cliente es obligatorio")
    private String customerEmail;

    @NotEmpty(message = "La orden debe contener al menos un producto")
    private List<OrderItemRequest> items;


}
