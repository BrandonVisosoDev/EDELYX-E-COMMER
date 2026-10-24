package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Products;
import com.mx.catalogservice.model.ProductRequest;
import com.mx.catalogservice.model.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;

import java.awt.print.Pageable;

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

    void desactivateProduct(Long id);




}
