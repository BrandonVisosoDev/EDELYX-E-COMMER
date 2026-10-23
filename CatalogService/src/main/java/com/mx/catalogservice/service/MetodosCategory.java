package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.model.Respuesta;
import org.springframework.http.ResponseEntity;

public interface MetodosCategory {

    // CRUD DE CATEGORY

    // CREATE

    ResponseEntity<Respuesta> createCategory(Category category);

    // READ

    ResponseEntity<Respuesta> listCategories();

    // UPDATE

    ResponseEntity<Respuesta> updateCategory(Category category);

    // DELETE

    ResponseEntity<Respuesta> deleteCategoryById(Long id);




}
