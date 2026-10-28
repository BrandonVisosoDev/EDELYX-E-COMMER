package com.mx.catalogservice.controller;

import com.mx.catalogservice.model.CategoryRequest;
import com.mx.catalogservice.model.CategoryResponse;
import com.mx.catalogservice.service.MetodosCategory;
import jakarta.validation.Valid;
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

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final MetodosCategory service;

    public CategoryController(MetodosCategory service) {
        this.service = service;
    }

    // POST -> CREAR CATEGORIA (201 CREATED)
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = service.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET -> LISTAR CATEGORIAS ACTIVAS (200 OK)
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listActiveCategories() {
        return ResponseEntity.ok(service.listActiveCategories());
    }

    // PUT -> ACTUALIZAR CATEGORIA (200 OK)
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(service.updateCategory(id, request));
    }

    // DELETE -> DESACTIVAR CATEGORIA (204 NO CONTENT)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateCategory(@PathVariable Long id) {
        service.deactivateCategory(id);
        return ResponseEntity.noContent().build();
    }

}
