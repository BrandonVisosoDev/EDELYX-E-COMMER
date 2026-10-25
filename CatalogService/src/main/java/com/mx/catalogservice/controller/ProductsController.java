package com.mx.catalogservice.controller;

import com.mx.catalogservice.model.ProductRequest;
import com.mx.catalogservice.model.ProductResponse;
import com.mx.catalogservice.service.MetodosProducts;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Le decimos que es un controlador
@RestController
// Le decimos que su ruta principal es
@RequestMapping("/api/products")
public class ProductsController {

    // Le inyectamos el constructor
    private final MetodosProducts service;

    public ProductsController(MetodosProducts service) {
        this.service = service;
    }

    // POST -> CREAR PRODUCTO (201 CREATED)
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request){
        ProductResponse response = service.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET -> LISTAR PRODUCTOS ACTIVOS PAGINADOS (200 OK)
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> listProducts(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(service.listProducts(pageable));
    }

    // GET -> OBTENER PRODUCTO POR ID (200 OK)
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProductById(id));
    }

    // PUT -> ACTUALIZAR PRODUCTO (200 OK)

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(

        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request) {

      return ResponseEntity.ok(service.updateProduct(id, request));


    }

    // DELETE -> DESACTIVAR PRODUCTO (204 NOT CONTENT)

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>deactivateProduct(@PathVariable Long id){

        service.deactivateProduct(id);
        return ResponseEntity.noContent().build();


    }








}
