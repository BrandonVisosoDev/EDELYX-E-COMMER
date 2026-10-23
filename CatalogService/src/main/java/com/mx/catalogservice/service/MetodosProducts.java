package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Products;
import com.mx.catalogservice.model.Respuesta;
import org.springframework.http.ResponseEntity;

public interface MetodosProducts {

    // CRUD DE PRODUCTS

    // CREATE

    ResponseEntity<Respuesta> createProduct(Products products);

    // READ

    ResponseEntity<Respuesta> listProducts();

    // UPDATE

    ResponseEntity<Respuesta> updateProduct(Products products);

    // DELETE

    ResponseEntity<Respuesta> deleteProductById(Long id);




}
