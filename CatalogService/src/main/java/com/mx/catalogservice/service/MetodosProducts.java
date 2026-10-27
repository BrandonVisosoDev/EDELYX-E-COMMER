package com.mx.catalogservice.service;

import com.mx.catalogservice.event.OrderItemStockDto;
import com.mx.catalogservice.model.ProductRequest;
import com.mx.catalogservice.model.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MetodosProducts {

    // CRUD DE PRODUCTS

    // CREATE
    ProductResponse createProduct(ProductRequest request);

    // READ
    Page<ProductResponse> listProducts(Pageable pageable);

    // READ BY ID
    ProductResponse getProductById(Long id);

    // UPDATE
    ProductResponse updateProduct(Long id, ProductRequest request);

    // DELETE
    void deactivateProduct(Long id);

    // DEL RABBIT

    void descontarStock(List<OrderItemStockDto> items);
    void reintegrarStock(List<OrderItemStockDto> items);


}
